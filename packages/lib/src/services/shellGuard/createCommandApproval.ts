import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { CommandApprovalStatus } from "../../enums.js";
import type { CommandApprovalItem } from "../../resources/ddb/schema/commandApproval.js";
import type { ServiceContext } from "../context.js";

export interface CreateCommandApprovalInput {
  agentId: string;
  taskId: string;
  command: string;
  reason: string;
  logEntryId?: string;
}

export async function createCommandApproval(
  ctx: ServiceContext,
  input: CreateCommandApprovalInput,
): Promise<CommandApprovalItem> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const item: CommandApprovalItem = {
    id,
    agentId: input.agentId,
    taskId: input.taskId,
    command: input.command,
    reason: input.reason,
    status: CommandApprovalStatus.Pending,
    decision: null,
    logEntryId: input.logEntryId ?? "",
    createdAt: now,
    resolvedAt: null,
  };

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...item,
        _et: "CommandApproval",
        pk: "COMMAND_APPROVAL",
        sk: `COMMAND_APPROVAL#${id}`,
      },
    }),
  );

  ctx.log.info(
    { commandApprovalId: id, agentId: input.agentId, taskId: input.taskId },
    "Created command approval",
  );

  ctx.resources.pubsub.publish("pendingItemsUpdated");

  return item;
}
