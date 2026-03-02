import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE_NAME || "gremlin";
const DEFAULT_TZ = "America/New_York";

const jobIds = ["1", "2", "3"];

async function backfill() {
  console.log(`Backfilling timezone="${DEFAULT_TZ}" for ${jobIds.length} jobs...`);

  for (const id of jobIds) {
    await docClient.send(
      new UpdateCommand({
        TableName,
        Key: { pk: "AGENT_JOB", sk: `AGENT_JOB#${id}` },
        UpdateExpression: "SET #tz = if_not_exists(#tz, :tz)",
        ExpressionAttributeNames: { "#tz": "timezone" },
        ExpressionAttributeValues: { ":tz": DEFAULT_TZ },
      }),
    );
    console.log(`  ✓ Job ${id}`);
  }

  console.log("Done.");
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
