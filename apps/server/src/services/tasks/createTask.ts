import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

export async function createTask(
  ctx: ServiceContext,
  input: {
    agentId: string;
    title: string;
    originJobId?: string;
  },
): Promise<TaskItem> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const item = {
    id,
    agentId: input.agentId,
    title: input.title,
    status: "PENDING" as const,
    statusReason: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    originJobId: input.originJobId ?? null,
  };

  await ctx.resources.ddb.entities.Task.build(PutItemCommand).item(item).send();

  return item;
}
