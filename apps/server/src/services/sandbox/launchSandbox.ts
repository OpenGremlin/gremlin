import {
  CreateTagsCommand,
  DescribeInstanceStatusCommand,
  DescribeInstancesCommand,
  EC2Client,
  RunInstancesCommand,
  StartInstancesCommand,
} from "@aws-sdk/client-ec2";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { createLogger } from "../../logger.js";
import type { SandboxSession } from "./types.js";

const log = createLogger("sandbox:launch");
const ec2 = new EC2Client({});
const ssm = new SSMClient({});

let cachedLaunchTemplateId: string | undefined;
let cachedSubnetId: string | undefined;

async function getSandboxConfig(): Promise<{
  launchTemplateId: string;
  subnetId: string;
}> {
  if (cachedLaunchTemplateId && cachedSubnetId) {
    log.debug("Using cached sandbox config");
    return {
      launchTemplateId: cachedLaunchTemplateId,
      subnetId: cachedSubnetId,
    };
  }

  if (
    process.env.SANDBOX_LAUNCH_TEMPLATE_ID &&
    process.env.SANDBOX_EC2_SUBNET_ID
  ) {
    log.info("Loading sandbox config from env vars");
    cachedLaunchTemplateId = process.env.SANDBOX_LAUNCH_TEMPLATE_ID;
    cachedSubnetId = process.env.SANDBOX_EC2_SUBNET_ID;
  } else {
    log.info("Loading sandbox config from SSM");
    const [ltRes, subnetRes] = await Promise.all([
      ssm.send(
        new GetParameterCommand({
          Name: "/gremlin/sandbox-launch-template-id",
        }),
      ),
      ssm.send(
        new GetParameterCommand({ Name: "/gremlin/sandbox-ec2-subnet-id" }),
      ),
    ]);
    cachedLaunchTemplateId = ltRes.Parameter?.Value;
    cachedSubnetId = subnetRes.Parameter?.Value;
    log.info(
      {
        launchTemplateId: cachedLaunchTemplateId,
        subnetId: cachedSubnetId,
      },
      "SSM config loaded",
    );
  }

  if (!cachedLaunchTemplateId || !cachedSubnetId) {
    throw new Error("Sandbox config not found in env vars or SSM");
  }
  return {
    launchTemplateId: cachedLaunchTemplateId,
    subnetId: cachedSubnetId,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SANDBOX_LOCAL = process.env.SANDBOX_LOCAL === "true";
const SANDBOX_LOCAL_WS_URL =
  process.env.SANDBOX_LOCAL_WS_URL ?? "ws://localhost:8080";

async function getInstanceState(instanceId: string): Promise<{
  state: string | undefined;
  privateIp: string | undefined;
}> {
  const desc = await ec2.send(
    new DescribeInstancesCommand({ InstanceIds: [instanceId] }),
  );
  const instance = desc.Reservations?.[0]?.Instances?.[0];
  return {
    state: instance?.State?.Name,
    privateIp: instance?.PrivateIpAddress,
  };
}

async function pollUntilRunning(
  instanceId: string,
  agentId: string,
): Promise<string> {
  const maxAttempts = 60; // 60 * 3s = 180s
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);
    const { state, privateIp } = await getInstanceState(instanceId);
    log.debug(
      { agentId, instanceId, attempt: i + 1, state },
      "Polling instance state",
    );

    if (state === "running" && privateIp) {
      log.info(
        { agentId, instanceId, privateIp, attempts: i + 1 },
        "Instance is running",
      );
      return privateIp;
    }
    if (state === "terminated" || state === "shutting-down") {
      throw new Error(`Instance ${instanceId} is ${state}`);
    }
  }
  throw new Error(`Instance ${instanceId} did not become running within 180s`);
}

async function pollHealthEndpoint(
  privateIp: string,
  agentId: string,
): Promise<void> {
  const url = `http://${privateIp}:8083/health`;
  const maxAttempts = 40; // 40 * 3s = 120s
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        log.info(
          { agentId, privateIp, attempts: i + 1 },
          "Health check passed",
        );
        return;
      }
    } catch {
      // Connection refused or timeout — keep polling
    }
    log.debug({ agentId, privateIp, attempt: i + 1 }, "Health check pending");
    await sleep(3000);
  }
  throw new Error(
    `Sandbox relay at ${privateIp} did not become healthy within 120s`,
  );
}

export async function launchSandbox(
  agentId: string,
  existingInstanceId?: string,
): Promise<SandboxSession> {
  if (SANDBOX_LOCAL) {
    log.info({ agentId, wsUrl: SANDBOX_LOCAL_WS_URL }, "Using local sandbox");
    return {
      instanceId: "local",
      privateIp: "127.0.0.1",
      wsUrl: SANDBOX_LOCAL_WS_URL,
      agentId,
    };
  }

  // Try to reuse existing instance
  if (existingInstanceId) {
    log.info(
      { agentId, instanceId: existingInstanceId },
      "Checking existing instance",
    );
    try {
      const { state, privateIp } = await getInstanceState(existingInstanceId);
      log.info(
        { agentId, instanceId: existingInstanceId, state },
        "Existing instance state",
      );

      if (state === "running" && privateIp) {
        await pollHealthEndpoint(privateIp, agentId);
        return {
          instanceId: existingInstanceId,
          privateIp,
          wsUrl: `ws://${privateIp}:8080`,
          agentId,
        };
      }

      if (state === "stopped") {
        log.info(
          { agentId, instanceId: existingInstanceId },
          "Starting stopped instance",
        );
        await ec2.send(
          new StartInstancesCommand({ InstanceIds: [existingInstanceId] }),
        );
        const ip = await pollUntilRunning(existingInstanceId, agentId);
        await pollHealthEndpoint(ip, agentId);
        return {
          instanceId: existingInstanceId,
          privateIp: ip,
          wsUrl: `ws://${ip}:8080`,
          agentId,
        };
      }

      // terminated or other — fall through to create new
      log.warn(
        { agentId, instanceId: existingInstanceId, state },
        "Existing instance unusable, creating new one",
      );
    } catch (err) {
      log.warn(
        {
          agentId,
          instanceId: existingInstanceId,
          error: (err as Error).message,
        },
        "Failed to check existing instance, creating new one",
      );
    }
  }

  // Create new instance
  log.info({ agentId }, "Creating new EC2 sandbox instance");
  const { launchTemplateId, subnetId } = await getSandboxConfig();

  const runResult = await ec2.send(
    new RunInstancesCommand({
      LaunchTemplate: { LaunchTemplateId: launchTemplateId },
      SubnetId: subnetId,
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [
            { Key: "Name", Value: `gremlin-sandbox-${agentId}` },
            { Key: "gremlin:agentId", Value: agentId },
          ],
        },
      ],
    }),
  );

  const instanceId = runResult.Instances?.[0]?.InstanceId;
  if (!instanceId) {
    throw new Error("Failed to launch EC2 sandbox instance");
  }

  log.info(
    { agentId, instanceId },
    "EC2 instance launched, polling until running",
  );
  const privateIp = await pollUntilRunning(instanceId, agentId);
  await pollHealthEndpoint(privateIp, agentId);

  const session: SandboxSession = {
    instanceId,
    privateIp,
    wsUrl: `ws://${privateIp}:8080`,
    agentId,
  };

  log.info(
    { agentId, instanceId, privateIp, wsUrl: session.wsUrl },
    "Sandbox launched successfully",
  );
  return session;
}
