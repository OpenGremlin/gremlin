import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { ToolName } from "../../enums.js";
import type { AgentLogItem } from "../../resources/ddb/schema/agentLog.js";
import type { ServiceContext } from "../context.js";
import type { Attachment } from "../tasks/attachment.js";
import {
  extractToolError,
  type GremlinToolError,
  unwrapToolData,
} from "../tools/toolResult.js";

type TextLogEntry = {
  id?: string;
  agentId: string;
  taskId: string | null;
  role: "AGENT" | "USER" | "SYSTEM";
  content: string;
  attachments?: Attachment[];
};

type ToolLogEntry = {
  id?: string;
  agentId: string;
  taskId: string | null;
  role: "TOOL";
  toolName: ToolName;
  toolInput: unknown;
  toolResult: unknown;
  internal?: boolean;
  requestId?: string | null;
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
  const id = entry.id ?? crypto.randomUUID();

  const isToolEntry = entry.role === "TOOL";
  const toolError = isToolEntry ? extractToolError(entry.toolResult) : null;

  const item = {
    id,
    agentId: entry.agentId,
    taskId: entry.taskId,
    role: entry.role,
    content: isToolEntry ? `Tool call: ${entry.toolName}` : entry.content,
    toolName: isToolEntry ? entry.toolName : null,
    toolInput: isToolEntry ? JSON.stringify(entry.toolInput) : null,
    toolResult: isToolEntry ? JSON.stringify(entry.toolResult) : null,
    ...(toolError ? { toolError } : {}),
    ...(!isToolEntry && entry.attachments?.length
      ? { attachments: entry.attachments }
      : {}),
    internal: (isToolEntry && entry.internal) || false,
    ...(isToolEntry && entry.requestId ? { requestId: entry.requestId } : {}),
    ...(isToolEntry && entry.commandApprovalId
      ? { commandApprovalId: entry.commandApprovalId }
      : {}),
    createdAt: now,
  };

  const table = ctx.resources.ddb.chatTable;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...item,
        _et: "AgentLog",
        pk: `AGENT_LOG#${id}`,
        sk: "AGENT_LOG",
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

/**
 * Extract a file attachment from a successful tool result that contains a
 * `path` field. Reads from the unwrapped `data` payload of a
 * `GremlinToolResult<R>`; older unwrapped shapes fall through and return [].
 */
function extractFileAttachment(toolResult: unknown): Attachment[] {
  const data = unwrapToolData(toolResult);
  if (
    data &&
    typeof data === "object" &&
    "path" in data &&
    typeof (data as Record<string, unknown>).path === "string"
  ) {
    return [
      {
        type: "file",
        path: (data as Record<string, unknown>).path as string,
      },
    ];
  }
  return [];
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
  const table = ctx.resources.ddb.chatTable;
  const attachments = extractFileAttachment(entry.toolResult);
  const toolError: GremlinToolError | null = extractToolError(entry.toolResult);

  const updateParts = ["toolResult = :result", "toolInput = :input"];
  const exprValues: Record<string, unknown> = {
    ":result": JSON.stringify(entry.toolResult),
    ":input": JSON.stringify(entry.toolInput),
  };

  if (attachments.length > 0) {
    updateParts.push("attachments = :att");
    exprValues[":att"] = attachments;
  }

  if (entry.commandApprovalId) {
    updateParts.push("commandApprovalId = :caid");
    exprValues[":caid"] = entry.commandApprovalId;
  }

  const removeParts: string[] = [];
  if (toolError) {
    updateParts.push("toolError = :terr");
    exprValues[":terr"] = toolError;
  } else {
    // Successful tool result: drop any toolError attribute on the row.
    // Eager writes (toolResult: null) don't set this attribute, so for most
    // updates the REMOVE is a DDB no-op. We still issue it unconditionally
    // to guarantee a clean row after tool-approval retries where an earlier
    // attempt wrote an error and the follow-up succeeded.
    removeParts.push("toolError");
  }

  const updateExpression = [
    `SET ${updateParts.join(", ")}`,
    removeParts.length > 0 ? `REMOVE ${removeParts.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  await table.getDocumentClient().send(
    new UpdateCommand({
      TableName: table.getName(),
      Key: { pk: `AGENT_LOG#${logId}`, sk: "AGENT_LOG" },
      UpdateExpression: updateExpression,
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
    ...(toolError ? { toolError } : {}),
    ...(attachments.length > 0 ? { attachments } : {}),
    ...(entry.commandApprovalId
      ? { commandApprovalId: entry.commandApprovalId }
      : {}),
    internal: false,
    createdAt,
  });
}
