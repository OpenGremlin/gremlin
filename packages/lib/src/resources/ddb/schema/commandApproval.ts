import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { ChatTable } from "../chatTable.js";

export const CommandApprovalEntity = new Entity({
  name: "CommandApproval",
  table: ChatTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    taskId: string(),
    command: string(),
    reason: string(),
    status: string(), // "PENDING" | "RESOLVED"
    decision: anyOf(string(), nul()), // "allow-once" | "allow-always" | "deny"
    logEntryId: string(), // the agent log entry this is attached to
    createdAt: string(),
    resolvedAt: anyOf(string(), nul()),
  }),
  computeKey: ({ id }) => ({
    pk: "COMMAND_APPROVAL",
    sk: `COMMAND_APPROVAL#${id}`,
  }),
});

export type CommandApprovalItem = FormattedItem<typeof CommandApprovalEntity>;
