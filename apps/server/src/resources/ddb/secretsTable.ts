import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table } from "dynamodb-toolbox/table";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const documentClient = DynamoDBDocumentClient.from(client);

export const SecretsTable = new Table({
  name: process.env.SECRETS_TABLE_NAME || "gremlin-secrets",
  partitionKey: { name: "pk", type: "string" },
  sortKey: { name: "sk", type: "string" },
  documentClient,
});
