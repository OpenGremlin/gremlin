import { ECSClient, StopTaskCommand } from "@aws-sdk/client-ecs";
import type { SandboxSession } from "./types.js";

const ecs = new ECSClient({});
const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME ?? "";

export async function terminateSandbox(session: SandboxSession): Promise<void> {
  // Close WebSocket
  if (session.ws && session.ws.readyState === session.ws.OPEN) {
    session.ws.close();
    session.ws = undefined;
  }

  // Stop ECS task
  await ecs.send(
    new StopTaskCommand({
      cluster: CLUSTER_NAME,
      task: session.taskArn,
      reason: "Sandbox terminated by server",
    }),
  );
}
