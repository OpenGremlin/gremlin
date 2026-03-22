import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table } from "dynamodb-toolbox/table";
import { ddbClient } from "./client.js";

const documentClient = DynamoDBDocumentClient.from(ddbClient);

export const SecretsTable = new Table({
  name: process.env.SECRETS_TABLE_NAME || "gremlin-secrets",
  partitionKey: { name: "pk", type: "string" },
  sortKey: { name: "sk", type: "string" },
  documentClient,
});
