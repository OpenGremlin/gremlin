import { ECSClient, StopTaskCommand } from "@aws-sdk/client-ecs";
import { createLogger } from "../../logger.js";
import type { BrowserSession } from "./types.js";

const log = createLogger("sandbox:browser-terminate");
const ecs = new ECSClient({});
const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME ?? "";

export async function terminateBrowser(session: BrowserSession): Promise<void> {
  log.info(
    { agentId: session.agentId, taskArn: session.taskArn },
    "Terminating browser task",
  );

  await ecs.send(
    new StopTaskCommand({
      cluster: CLUSTER_NAME,
      task: session.taskArn,
      reason: "Browser terminated by server",
    }),
  );

  log.info(
    { agentId: session.agentId, taskArn: session.taskArn },
    "Browser task stopped",
  );
}
