import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { pkShard } from "../../resources/ddb/shard.js";
import type { TaskItem } from "../../resources/ddb/schema/task.js";
import type { ServiceContext } from "../context.js";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateTaskId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += CHARS[bytes[i] % CHARS.length];
  }
  return id;
}

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
    status?: string;
    priority?: number;
    parentId?: string;
    deferUntil?: string;
    description?: string;
    emoji?: string;
  },
): Promise<TaskItem> {
  const now = new Date().toISOString();
  const id = generateTaskId();
  const status = input.status ?? "open";

  const item: TaskItem = {
    id,
    agentId: input.agentId,
    title: input.title,
    message: null,
    createdAt: now,
    updatedAt: now,
    originJobId: input.originJobId ?? null,
    status,
    ...(input.assignerAgentId
      ? { assignerAgentId: input.assignerAgentId }
      : {}),
    ...(input.brief ? { brief: input.brief } : {}),
    ...(input.successCriteria
      ? { successCriteria: input.successCriteria }
      : {}),
    ...(input.priority != null ? { priority: input.priority } : {}),
    ...(input.parentId ? { parentId: input.parentId } : {}),
    ...(input.deferUntil ? { deferUntil: input.deferUntil } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.emoji ? { emoji: input.emoji } : {}),
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
        pk: pkShard("TASK", id),
        sk: `TASK#${id}`,
        gsi1pk: `TASK_AGENT#${input.agentId}`,
        gsi1sk: now,
        gsi2pk: "TASK_ALL",
        gsi2sk: `${now}#${id}`,
        // GSI3: query children by parent
        ...(input.parentId
          ? {
              gsi3pk: `TASK_PARENT#${input.parentId}`,
              gsi3sk: `${now}#${id}`,
            }
          : {}),
        // GSI4: query by status
        gsi4pk: `TASK_STATUS#${status}`,
        gsi4sk: `${now}#${id}`,
      },
    }),
  );

  if (input.originJobId) {
    ctx.resources.pubsub.publish(`jobTaskCreated:${input.originJobId}`, item);
  }

  return item;
}
