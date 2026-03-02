import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

export async function createFollowUp(
  ctx: ServiceContext,
  input: {
    taskId: string;
    agentId: string;
    delayMs: number;
    prompt: string;
  },
) {
  const now = new Date();
  const id = crypto.randomUUID();
  const scheduledAt = new Date(now.getTime() + input.delayMs).toISOString();

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        id,
        taskId: input.taskId,
        agentId: input.agentId,
        scheduledAt,
        prompt: input.prompt,
        active: true,
        createdAt: now.toISOString(),
        _et: "TaskFollowUp",
        pk: "TASK_FOLLOW_UP",
        sk: `TASK_FOLLOW_UP#${id}`,
        gsi1pk: "FOLLOWUP_ACTIVE",
        gsi1sk: scheduledAt,
      },
    }),
  );

  return { id, scheduledAt };
}
