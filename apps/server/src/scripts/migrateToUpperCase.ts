import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.MAIN_TABLE_NAME || "gremlin";

async function migrateTasks() {
  console.log("Migrating Task status values to uppercase...");
  let lastKey: Record<string, unknown> | undefined;
  let migrated = 0;

  do {
    const scan = await docClient.send(
      new ScanCommand({
        TableName,
        FilterExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": "TASK" },
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const item of scan.Items ?? []) {
      const status = item.status as string;
      if (!status || status === status.toUpperCase()) continue;

      await docClient.send(
        new UpdateCommand({
          TableName,
          Key: { pk: item.pk, sk: item.sk },
          UpdateExpression: "SET #s = :s",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":s": status.toUpperCase() },
        }),
      );
      migrated++;
      console.log(
        `  Task ${item.sk}: "${status}" -> "${status.toUpperCase()}"`,
      );
    }

    lastKey = scan.LastEvaluatedKey;
  } while (lastKey);

  console.log(`Tasks migrated: ${migrated}`);
}

async function migrateAgentLogs() {
  console.log("Migrating AgentLog role values to uppercase...");
  let lastKey: Record<string, unknown> | undefined;
  let migrated = 0;

  do {
    const scan = await docClient.send(
      new ScanCommand({
        TableName,
        FilterExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": "AGENT_LOG" },
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const item of scan.Items ?? []) {
      const role = item.role as string;
      if (!role || role === role.toUpperCase()) continue;

      await docClient.send(
        new UpdateCommand({
          TableName,
          Key: { pk: item.pk, sk: item.sk },
          UpdateExpression: "SET #r = :r",
          ExpressionAttributeNames: { "#r": "role" },
          ExpressionAttributeValues: { ":r": role.toUpperCase() },
        }),
      );
      migrated++;
    }

    lastKey = scan.LastEvaluatedKey;
  } while (lastKey);

  console.log(`AgentLogs migrated: ${migrated}`);
}

async function migrate() {
  await migrateTasks();
  await migrateAgentLogs();
  console.log("Done.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
