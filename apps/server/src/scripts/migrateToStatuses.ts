import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE_NAME || "gremlin";

async function migrate() {
  console.log("Scanning for FEED_ITEM records...");

  let lastKey: Record<string, unknown> | undefined;
  let migrated = 0;

  do {
    const scan = await docClient.send(
      new ScanCommand({
        TableName,
        FilterExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": "FEED_ITEM" },
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const item of scan.Items ?? []) {
      const id = (item.sk as string).replace("FEED_ITEM#", "");
      const agentId = (item.gsi1pk as string).replace("FEED_AGENT#", "");

      const artifacts = [
        {
          type: "DOCUMENT",
          title: item.title as string,
          body: item.body as string,
        },
      ];

      // Write new STATUS item (include _et for dynamodb-toolbox entity filtering)
      await docClient.send(
        new PutCommand({
          TableName,
          Item: {
            pk: "STATUS",
            sk: `STATUS#${id}`,
            gsi1pk: `STATUS_AGENT#${agentId}`,
            gsi1sk: item.gsi1sk,
            _et: "Status",
            id,
            agentId,
            title: item.title,
            summary: item.summary,
            artifacts,
            category: item.category,
            completedAt: item.completedAt,
          },
        }),
      );

      // Delete old FEED_ITEM record
      await docClient.send(
        new DeleteCommand({
          TableName,
          Key: { pk: item.pk, sk: item.sk },
        }),
      );

      migrated++;
      console.log(`Migrated: ${id}`);
    }

    lastKey = scan.LastEvaluatedKey;
  } while (lastKey);

  console.log(`Done. Migrated ${migrated} items.`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
