import { Table } from "dynamodb-toolbox/table";
import { documentClient } from "./client.js";

export const SecretsTable = new Table({
  name: process.env.SECRETS_TABLE_NAME || "gremlin-secrets",
  partitionKey: { name: "pk", type: "string" },
  sortKey: { name: "sk", type: "string" },
  documentClient,
});
