import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

export async function createTask(
  ctx: ServiceContext,
  input: {
    agentId: string;
    title: string;
    originJobId?: string;
    /**
     * Agent that assigned this task. Set when the task is delegated from
     * another agent. Omit for background tasks the agent creates for itself —
     * runtime code reads `task.assignerAgentId ?? task.agentId` as a fallback.
     */
    assignerAgentId?: string;
    /** Explicit, self-contained brief passed via the `delegate` tool. */
    brief?: string;
    successCriteria?: string;
  },
): Promise<TaskItem> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const item: TaskItem = {
    id,
    agentId: input.agentId,
    title: input.title,
    message: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    originJobId: input.originJobId ?? null,
    ...(input.assignerAgentId
      ? { assignerAgentId: input.assignerAgentId }
      : {}),
    ...(input.brief ? { brief: input.brief } : {}),
    ...(input.successCriteria
      ? { successCriteria: input.successCriteria }
      : {}),
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
        gsi2pk: "TASK_ALL",
        gsi2sk: `${now}#${id}`,
      },
    }),
  );

  if (input.originJobId) {
    ctx.resources.pubsub.publish(`jobTaskCreated:${input.originJobId}`, item);
  }

  return item;
}
