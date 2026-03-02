import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

export const MemoryTopicEntity = new Entity({
  name: "MemoryTopic",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    agentId: string().key(),
    topic: string().key(),
    content: string(),
    updatedAt: string(),
  }),
  computeKey: ({ agentId, topic }) => ({
    pk: "MEMORY_TOPIC",
    sk: `MEMORY_TOPIC#${agentId}#${topic}`,
  }),
});

export type MemoryTopicItem = FormattedItem<typeof MemoryTopicEntity>;
