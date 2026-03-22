import {
  DescribeInstancesCommand,
  RunInstancesCommand,
  StartInstancesCommand,
  TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";
import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { createLogger } from "../../logger.js";
import { getEc2Client } from "./ec2Client.js";
import { getSsmClient } from "./ssmClient.js";
import type { SandboxSession } from "./types.js";

const log = createLogger("sandbox:launch");

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
    const ssm = await getSsmClient();
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

const SANDBOX_LOCAL = process.env.SANDBOX_LOCAL === "true";
const SANDBOX_LOCAL_WS_URL =
  process.env.SANDBOX_LOCAL_WS_URL ?? "ws://localhost:8080";

async function getInstanceState(instanceId: string): Promise<{
  state: string | undefined;
  privateIp: string | undefined;
}> {
  const ec2 = await getEc2Client();
  const desc = await ec2.send(
    new DescribeInstancesCommand({ InstanceIds: [instanceId] }),
  );
  const instance = desc.Reservations?.[0]?.Instances?.[0];
  return {
    state: instance?.State?.Name,
    privateIp: instance?.PrivateIpAddress,
  };
}

/**
 * Try to connect to an existing running instance without polling.
 * Returns a session if the instance is running and healthy, null otherwise.
 */
export async function tryQuickConnect(
  agentId: string,
  existingInstanceId: string,
): Promise<SandboxSession | null> {
  if (SANDBOX_LOCAL) {
    return {
      instanceId: "local",
      privateIp: "127.0.0.1",
      wsUrl: SANDBOX_LOCAL_WS_URL,
      agentId,
      lastActivityAt: Date.now(),
    };
  }

  try {
    const { state, privateIp } = await getInstanceState(existingInstanceId);
    if (state !== "running" || !privateIp) {
      log.info(
        { agentId, instanceId: existingInstanceId, state },
        "Instance not running for quick connect",
      );
      return null;
    }

    // Single health check attempt (no polling)
    const url = `http://${privateIp}:8083/health`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;

    log.info(
      { agentId, instanceId: existingInstanceId, privateIp },
      "Quick connect: instance is healthy",
    );
    return {
      instanceId: existingInstanceId,
      privateIp,
      wsUrl: `ws://${privateIp}:8080`,
      agentId,
      lastActivityAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Launch a sandbox instance for the given agent. If an existing instance is
 * on the current launch template and is stopped, it will be started instead
 * of creating a new one. Returns the instance ID immediately without waiting
 * for it to boot.
 */
export async function launchInstance(
  agentId: string,
  existingInstanceId?: string,
): Promise<string> {
  log.info(
    { agentId, existingInstanceId },
    "Launching EC2 sandbox instance (non-blocking)",
  );
  const ec2 = await getEc2Client();
  const { launchTemplateId, subnetId } = await getSandboxConfig();

  // Try to reuse existing instance if it's on the current launch template
  if (existingInstanceId) {
    try {
      const desc = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: [existingInstanceId] }),
      );
      const instance = desc.Reservations?.[0]?.Instances?.[0];
      const state = instance?.State?.Name;
      const tags = instance?.Tags ?? [];
      const currentLtId = tags.find(
        (t) => t.Key === "aws:ec2launchtemplate:id",
      )?.Value;

      if (currentLtId === launchTemplateId) {
        if (state === "stopped") {
          log.info(
            { agentId, instanceId: existingInstanceId },
            "Starting stopped instance (same launch template)",
          );
          await ec2.send(
            new StartInstancesCommand({
              InstanceIds: [existingInstanceId],
            }),
          );
          return existingInstanceId;
        }
        if (state === "running" || state === "pending") {
          log.info(
            { agentId, instanceId: existingInstanceId, state },
            "Existing instance still usable (same launch template)",
          );
          return existingInstanceId;
        }
      } else {
        log.info(
          {
            agentId,
            instanceId: existingInstanceId,
            instanceLtId: currentLtId,
            expectedLtId: launchTemplateId,
          },
          "Existing instance on old launch template, will create new",
        );
        // Terminate old instance
        ec2
          .send(
            new TerminateInstancesCommand({
              InstanceIds: [existingInstanceId],
            }),
          )
          .catch((err) =>
            log.warn(
              {
                agentId,
                instanceId: existingInstanceId,
                error: (err as Error).message,
              },
              "Failed to terminate old instance",
            ),
          );
      }
    } catch (err) {
      log.warn(
        {
          agentId,
          instanceId: existingInstanceId,
          error: (err as Error).message,
        },
        "Failed to check existing instance",
      );
    }
  }

  const runResult = await ec2.send(
    new RunInstancesCommand({
      LaunchTemplate: {
        LaunchTemplateId: launchTemplateId,
        Version: "$Latest",
      },
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

  log.info({ agentId, instanceId }, "EC2 instance launch initiated");
  return instanceId;
}
