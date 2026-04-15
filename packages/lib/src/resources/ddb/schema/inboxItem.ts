import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { ChatTable } from "../chatTable.js";

export const InboxItemEntity = new Entity({
  name: "InboxItem",
  table: ChatTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    lane: string(),
    type: string(),
    payload: string(),
    isRead: boolean(),
    createdAt: string(),
  }),
  // NOTE: PK/SK and GSI keys are written directly via AWS SDK PutCommand
  // because dynamodb-toolbox v2 computeKey ignores GSI attributes,
  // and our composite SK (ITEM#createdAt#id) needs both fields.
  computeKey: ({ id }) => ({
    pk: "AGENT_INBOX",
    sk: `ITEM#${id}`,
  }),
});

export type InboxItemItem = FormattedItem<typeof InboxItemEntity>;
