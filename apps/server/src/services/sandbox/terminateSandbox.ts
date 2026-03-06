import { ECSClient, StopTaskCommand } from "@aws-sdk/client-ecs";
import { createLogger } from "../../logger.js";
import type { SandboxSession } from "./types.js";

const log = createLogger("sandbox:terminate");
const ecs = new ECSClient({});
const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME ?? "";

export async function terminateSandbox(session: SandboxSession): Promise<void> {
  log.info({ agentId: session.agentId, taskArn: session.taskArn }, "Terminating sandbox");

  // Close WebSocket
  if (session.ws && session.ws.readyState === session.ws.OPEN) {
    log.debug({ agentId: session.agentId }, "Closing WebSocket connection");
    session.ws.close();
    session.ws = undefined;
  }

  // Stop ECS task
  log.info({ agentId: session.agentId, taskArn: session.taskArn, cluster: CLUSTER_NAME }, "Stopping ECS task");
  await ecs.send(
    new StopTaskCommand({
      cluster: CLUSTER_NAME,
      task: session.taskArn,
      reason: "Sandbox terminated by server",
    }),
  );

  log.info({ agentId: session.agentId, taskArn: session.taskArn }, "Sandbox terminated");
}
