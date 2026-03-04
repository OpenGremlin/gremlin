import { PutCommand } from "@aws-sdk/lib-dynamodb";
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
    message: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    originJobId: input.originJobId ?? null,
    image: null,
    artifacts: [],
  };

  // Write directly via document client so we can include GSI attributes.
  // DynamoDB Toolbox v2's computeKey doesn't project GSI keys into the item.
  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...item,
        _et: "Task",
        pk: "TASK",
        sk: `TASK#${id}`,
        gsi1pk: `TASK_AGENT#${input.agentId}`,
        gsi1sk: now,
      },
    }),
  );

  // Notify subscribers so the agent status re-derives to ACTIVE
  await ctx.services.agents.resolveAgentStatus(ctx, input.agentId);

  return item;
}
