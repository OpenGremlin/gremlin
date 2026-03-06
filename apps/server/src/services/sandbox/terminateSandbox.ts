import { EC2Client, StopInstancesCommand } from "@aws-sdk/client-ec2";
import { createLogger } from "../../logger.js";
import type { SandboxSession } from "./types.js";

const log = createLogger("sandbox:terminate");
const ec2 = new EC2Client({});

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

  // Stop EC2 instance (not terminate — preserves EBS for next start)
  log.info(
    { agentId: session.agentId, instanceId: session.instanceId },
    "Stopping EC2 instance",
  );
  await ec2.send(
    new StopInstancesCommand({
      InstanceIds: [session.instanceId],
    }),
  );

  log.info(
    { agentId: session.agentId, instanceId: session.instanceId },
    "Sandbox stopped",
  );
}
