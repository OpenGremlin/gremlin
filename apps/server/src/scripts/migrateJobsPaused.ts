import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.LOCALSTACK_ENDPOINT;
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  ...(endpoint ? { endpoint } : {}),
});
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE_NAME || "gremlin";

async function migrate() {
  console.log("Migrating AgentJob: adding paused=false to existing jobs...");
  let lastKey: Record<string, unknown> | undefined;
  let migrated = 0;

  do {
    const scan = await docClient.send(
      new ScanCommand({
        TableName,
        FilterExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": "AGENT_JOB" },
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const item of scan.Items ?? []) {
      if (item.paused !== undefined) continue;

      await docClient.send(
        new UpdateCommand({
          TableName,
          Key: { pk: item.pk, sk: item.sk },
          UpdateExpression: "SET paused = :p REMOVE #s",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":p": false },
        }),
      );
      migrated++;
      console.log(`  Job ${item.sk}: set paused=false, removed status`);
    }

    lastKey = scan.LastEvaluatedKey;
  } while (lastKey);

  console.log(`Jobs migrated: ${migrated}`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
