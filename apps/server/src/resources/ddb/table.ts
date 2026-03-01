import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table } from "dynamodb-toolbox/table";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

const documentClient = DynamoDBDocumentClient.from(client);

export const GremlinTable = new Table({
  name: process.env.DYNAMODB_TABLE_NAME || "gremlin",
  partitionKey: { name: "pk", type: "string" },
  sortKey: { name: "sk", type: "string" },
  indexes: {
    gsi1: {
      type: "global",
      partitionKey: { name: "gsi1pk", type: "string" },
      sortKey: { name: "gsi1sk", type: "string" },
    },
  },
  documentClient,
});
