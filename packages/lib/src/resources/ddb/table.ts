import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table } from "dynamodb-toolbox/table";
import { ddbClient } from "./client.js";

const documentClient = DynamoDBDocumentClient.from(ddbClient);

export const GremlinTable = new Table({
  name: process.env.MAIN_TABLE_NAME || "gremlin",
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
