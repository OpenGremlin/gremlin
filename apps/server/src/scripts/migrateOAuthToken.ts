import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.GREMLIN_TABLE_NAME || "gremlin";

async function migrate() {
  console.log("Migrating GoogleOAuthToken → OAuthToken (provider-keyed)...\n");

  // Scan for old GoogleOAuthToken records (sk = "GOOGLE_OAUTH")
  const { Items = [] } = await docClient.send(
    new ScanCommand({
      TableName,
      FilterExpression: "sk = :sk",
      ExpressionAttributeValues: { ":sk": "GOOGLE_OAUTH" },
    }),
  );

  console.log(`Found ${Items.length} GoogleOAuthToken record(s) to migrate.\n`);

  let migrated = 0;
  for (const item of Items) {
    const userId = (item.pk as string).replace("USER#", "");

    // Write new record with provider-based key
    await docClient.send(
      new PutCommand({
        TableName,
        Item: {
          pk: `USER#${userId}`,
          sk: "OAUTH_TOKEN#google",
          _et: "OAuthToken",
          userId,
          provider: "google",
          accessToken: item.accessToken,
          refreshToken: item.refreshToken,
          expiresAt: item.expiresAt,
          scopes: item.scopes,
          email: item.email,
          connectedAt: item.connectedAt,
        },
      }),
    );

    // Delete old record
    await docClient.send(
      new DeleteCommand({
        TableName,
        Key: { pk: item.pk, sk: item.sk },
      }),
    );

    console.log(`  ✓ Migrated user ${userId}`);
    migrated++;
  }

  // Also clean up old Integration records
  const { Items: integrationItems = [] } = await docClient.send(
    new ScanCommand({
      TableName,
      FilterExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": "INTEGRATION" },
    }),
  );

  let deleted = 0;
  for (const item of integrationItems) {
    await docClient.send(
      new DeleteCommand({
        TableName,
        Key: { pk: item.pk, sk: item.sk },
      }),
    );
    console.log(`  ✓ Deleted old Integration record: ${item.id}`);
    deleted++;
  }

  console.log(
    `\nDone. Migrated ${migrated} token(s), deleted ${deleted} old Integration record(s).`,
  );
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
