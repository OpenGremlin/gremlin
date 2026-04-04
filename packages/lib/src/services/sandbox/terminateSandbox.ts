import { StopInstancesCommand } from "@aws-sdk/client-ec2";
import { createLogger } from "../../logger.js";
import { getEc2Client } from "./ec2Client.js";
import type { SandboxSession } from "./types.js";

const log = createLogger("sandbox:terminate");

export async function terminateSandbox(session: SandboxSession): Promise<void> {
  log.info(
    { agentId: session.agentId, instanceId: session.instanceId },
    "Terminating sandbox",
  );

  // Close WebSocket
  if (session.ws && session.ws.readyState === session.ws.OPEN) {
    log.debug({ agentId: session.agentId }, "Closing WebSocket connection");
    session.ws.close();
    session.ws = undefined;
  }

  // Skip EC2 stop for local sandbox
  if (session.instanceId === "local") {
    log.info({ agentId: session.agentId }, "Local sandbox — skipping EC2 stop");
    return;
  }

  // Hibernate EC2 instance — preserves memory state so container resumes
  // instantly on next start (no boot, no user data, no docker pull).
  // Falls back to regular stop if hibernation fails (e.g. instance doesn't
  // support it or has been running too long).
  log.info(
    { agentId: session.agentId, instanceId: session.instanceId },
    "Hibernating EC2 instance",
  );
  const ec2 = await getEc2Client();
  try {
    await ec2.send(
      new StopInstancesCommand({
        InstanceIds: [session.instanceId],
        Hibernate: true,
      }),
    );
  } catch (err) {
    log.warn(
      {
        agentId: session.agentId,
        instanceId: session.instanceId,
        error: (err as Error).message,
      },
      "Hibernate failed, falling back to regular stop",
    );
    await ec2.send(
      new StopInstancesCommand({
        InstanceIds: [session.instanceId],
      }),
    );
  }

  log.info(
    { agentId: session.agentId, instanceId: session.instanceId },
    "Sandbox hibernated",
  );
}
