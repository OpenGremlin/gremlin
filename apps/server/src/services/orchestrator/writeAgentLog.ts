import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

type TextLogEntry = {
  agentId: string;
  taskId: string | null;
  role: "AGENT" | "USER" | "SYSTEM";
  content: string;
};

type ToolLogEntry = {
  agentId: string;
  taskId: string | null;
  role: "TOOL";
  toolName: string;
  toolInput: unknown;
  toolResult: unknown;
  internal?: boolean;
};

export type LogEntry = TextLogEntry | ToolLogEntry;

export async function writeAgentLog(ctx: ServiceContext, entry: LogEntry) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const isToolEntry = entry.role === "TOOL";

  const item = {
    id,
    agentId: entry.agentId,
    taskId: entry.taskId,
    role: entry.role,
    content: isToolEntry ? `Tool call: ${entry.toolName}` : entry.content,
    toolName: isToolEntry ? entry.toolName : null,
    toolInput: isToolEntry ? JSON.stringify(entry.toolInput) : null,
    toolResult: isToolEntry ? JSON.stringify(entry.toolResult) : null,
    internal: (isToolEntry && entry.internal) || false,
    createdAt: now,
  };

  // Write directly via document client so we can include GSI attributes.
  // DynamoDB Toolbox v2's computeKey doesn't project GSI keys into the item.
  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...item,
        _et: "AgentLog",
        pk: "AGENT_LOG",
        sk: `AGENT_LOG#${id}`,
        gsi1pk: entry.taskId
          ? `LOG_TASK#${entry.taskId}`
          : `LOG_AGENT#${entry.agentId}`,
        gsi1sk: `${now}#${id}`,
      },
    }),
  );

  // Publish to the appropriate subscription channel
  if (entry.taskId) {
    ctx.resources.pubsub.publish(`agentLogCreated:task:${entry.taskId}`, item);
  } else {
    ctx.resources.pubsub.publish(`agentLogCreated:${entry.agentId}`, item);
  }

  return { id, createdAt: now };
}

/** Update an existing TOOL log entry with the result. */
export async function updateAgentLogResult(
  ctx: ServiceContext,
  logId: string,
  entry: {
    agentId: string;
    taskId: string | null;
    toolName: string;
    toolInput: unknown;
    toolResult: unknown;
  },
) {
  const table = ctx.resources.ddb.table;

  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: "AGENT_LOG", sk: `AGENT_LOG#${logId}` },
      UpdateExpression: "SET toolResult = :result, toolInput = :input",
      ExpressionAttributeValues: {
        ":result": JSON.stringify(entry.toolResult),
        ":input": JSON.stringify(entry.toolInput),
      },
    }),
  );

  // Re-publish so the frontend gets the updated entry
  // We need to read back the full item for the subscription payload
  const item = {
    id: logId,
    agentId: entry.agentId,
    taskId: entry.taskId,
    role: "TOOL",
    content: `Tool call: ${entry.toolName}`,
    toolName: entry.toolName,
    toolInput: JSON.stringify(entry.toolInput),
    toolResult: JSON.stringify(entry.toolResult),
    internal: false,
    createdAt: new Date().toISOString(),
  };

  if (entry.taskId) {
    ctx.resources.pubsub.publish(`agentLogCreated:task:${entry.taskId}`, item);
  } else {
    ctx.resources.pubsub.publish(`agentLogCreated:${entry.agentId}`, item);
  }
}
