import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table } from "dynamodb-toolbox/table";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  ...(process.env.LOCALSTACK_ENDPOINT && {
    endpoint: process.env.LOCALSTACK_ENDPOINT,
  }),
});

const documentClient = DynamoDBDocumentClient.from(client);

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
  },
  documentClient,
});
