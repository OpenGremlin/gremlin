import { Table } from "dynamodb-toolbox/table";
import { documentClient } from "./client.js";

export const ChatTable = new Table({
  name: process.env.CHAT_TABLE_NAME || "gremlin-chat",
  partitionKey: { name: "pk", type: "string" },
  sortKey: { name: "sk", type: "string" },
  indexes: {
    gsi1: {
      type: "global",
      partitionKey: { name: "gsi1pk", type: "string" },
      sortKey: { name: "gsi1sk", type: "string" },
    },
    gsi2: {
      type: "global",
      partitionKey: { name: "gsi2pk", type: "string" },
      sortKey: { name: "gsi2sk", type: "string" },
    },
    gsi3: {
      type: "global",
      partitionKey: { name: "gsi3pk", type: "string" },
      sortKey: { name: "gsi3sk", type: "string" },
    },
    gsi4: {
      type: "global",
      partitionKey: { name: "gsi4pk", type: "string" },
      sortKey: { name: "gsi4sk", type: "string" },
    },
  },
  documentClient,
});
