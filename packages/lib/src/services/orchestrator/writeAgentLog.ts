import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { ToolName } from "../../enums.js";
import type { AgentLogItem } from "../../resources/ddb/schema/agentLog.js";
import type { ServiceContext } from "../context.js";
import type { Attachment } from "../tasks/attachment.js";

type TextLogEntry = {
  agentId: string;
  taskId: string | null;
  role: "AGENT" | "USER" | "SYSTEM";
  content: string;
  attachments?: Attachment[];
};

type ToolLogEntry = {
  agentId: string;
  taskId: string | null;
  role: "TOOL";
  toolName: ToolName;
  toolInput: unknown;
  toolResult: unknown;
  internal?: boolean;
  notificationId?: string | null;
  commandApprovalId?: string | null;
};

export type LogEntry = TextLogEntry | ToolLogEntry;

function publishLog(
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
  item: AgentLogItem,
) {
  if (taskId) {
    ctx.resources.pubsub.publish(`agentLogCreated:task:${taskId}`, item);
  } else {
    ctx.resources.pubsub.publish(`agentLogCreated:${agentId}`, item);
  }
}

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
    ...(!isToolEntry && entry.attachments?.length
      ? { attachments: entry.attachments }
      : {}),
    internal: (isToolEntry && entry.internal) || false,
    ...(isToolEntry && entry.notificationId
      ? { notificationId: entry.notificationId }
      : {}),
    ...(isToolEntry && entry.commandApprovalId
      ? { commandApprovalId: entry.commandApprovalId }
      : {}),
    createdAt: now,
  };

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

  publishLog(ctx, entry.agentId, entry.taskId, item);
  return { id, createdAt: now };
}

/** Update an existing TOOL log entry with the result. */
export async function updateAgentLogResult(
  ctx: ServiceContext,
  logId: string,
  createdAt: string,
  entry: {
    agentId: string;
    taskId: string | null;
    toolName: ToolName;
    toolInput: unknown;
    toolResult: unknown;
    commandApprovalId?: string | null;
  },
) {
  const table = ctx.resources.ddb.table;

  const updateParts = ["toolResult = :result", "toolInput = :input"];
  const exprValues: Record<string, unknown> = {
    ":result": JSON.stringify(entry.toolResult),
    ":input": JSON.stringify(entry.toolInput),
  };

  if (entry.commandApprovalId) {
    updateParts.push("commandApprovalId = :caid");
    exprValues[":caid"] = entry.commandApprovalId;
  }

  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: "AGENT_LOG", sk: `AGENT_LOG#${logId}` },
      UpdateExpression: `SET ${updateParts.join(", ")}`,
      ExpressionAttributeValues: exprValues,
    }),
  );

  publishLog(ctx, entry.agentId, entry.taskId, {
    id: logId,
    agentId: entry.agentId,
    taskId: entry.taskId,
    role: "TOOL",
    content: `Tool call: ${entry.toolName}`,
    toolName: entry.toolName,
    toolInput: JSON.stringify(entry.toolInput),
    toolResult: JSON.stringify(entry.toolResult),
    ...(entry.commandApprovalId
      ? { commandApprovalId: entry.commandApprovalId }
      : {}),
    internal: false,
    createdAt,
  });
}
