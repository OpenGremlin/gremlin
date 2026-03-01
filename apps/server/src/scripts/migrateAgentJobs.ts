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
const TableName = process.env.DYNAMODB_TABLE_NAME || "gremlin";

/** Default agent ID to assign to jobs that don't have one yet. */
const DEFAULT_AGENT_ID = "clawd";

async function migrate() {
  console.log("Scanning for AGENT_JOB records missing agentId...");

  let lastKey: Record<string, unknown> | undefined;
  let migrated = 0;

  do {
    const scan = await docClient.send(
      new ScanCommand({
        TableName,
        FilterExpression: "pk = :pk AND attribute_not_exists(agentId)",
        ExpressionAttributeValues: { ":pk": "AGENT_JOB" },
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const item of scan.Items ?? []) {
      const id = (item.sk as string).replace("AGENT_JOB#", "");

      await docClient.send(
        new UpdateCommand({
          TableName,
          Key: { pk: item.pk, sk: item.sk },
          UpdateExpression: "SET agentId = :agentId",
          ExpressionAttributeValues: { ":agentId": DEFAULT_AGENT_ID },
        }),
      );

      migrated++;
      console.log(`  Updated: ${id} — assigned agentId="${DEFAULT_AGENT_ID}"`);
    }

    lastKey = scan.LastEvaluatedKey;
  } while (lastKey);

  console.log(`Done. Migrated ${migrated} jobs.`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
