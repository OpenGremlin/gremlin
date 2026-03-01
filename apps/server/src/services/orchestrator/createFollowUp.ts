import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
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

  await ctx.resources.ddb.entities.TaskFollowUp.build(PutItemCommand)
    .item({
      id,
      taskId: input.taskId,
      agentId: input.agentId,
      scheduledAt,
      prompt: input.prompt,
      active: true,
      createdAt: now.toISOString(),
    })
    .send();

  return { id, scheduledAt };
}
