import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { list } from "dynamodb-toolbox/schema/list";
import { map } from "dynamodb-toolbox/schema/map";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { ChatTable } from "../chatTable.js";

export const UserInputRequestEntity = new Entity({
  name: "UserInputRequest",
  table: ChatTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    agentId: string(),
    lane: string(),
    turnId: anyOf(string(), nul()),
    message: string(),
    actions: list(
      map({
        label: string(),
        style: string(),
      }),
    ),
    status: string(),
    resolvedAction: anyOf(string(), nul()),
    createdAt: string(),
  }),
  // NOTE: GSI keys (gsi1pk/gsi1sk) are written directly via AWS SDK
  // PutCommand because dynamodb-toolbox v2 computeKey ignores them.
  computeKey: ({ id }) => ({
    pk: "USER_INPUT_REQUEST",
    sk: `USER_INPUT_REQUEST#${id}`,
  }),
});

export type UserInputRequestItem = FormattedItem<typeof UserInputRequestEntity>;
