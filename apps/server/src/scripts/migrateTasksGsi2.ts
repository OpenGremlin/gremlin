import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: "us-east-1" }),
);
const TableName = process.env.MAIN_TABLE_NAME || "gremlin";

async function migrate() {
  let lastKey: Record<string, unknown> | undefined;
  let updated = 0;
  do {
    const { Items, LastEvaluatedKey } = await client.send(
      new ScanCommand({
        TableName,
        FilterExpression: "#et = :et AND attribute_not_exists(gsi2pk)",
        ExpressionAttributeNames: { "#et": "_et" },
        ExpressionAttributeValues: { ":et": "Task" },
        ...(lastKey && { ExclusiveStartKey: lastKey }),
      }),
    );
    for (const item of Items ?? []) {
      if (!item.createdAt || !item.id) continue;
      await client.send(
        new UpdateCommand({
          TableName,
          Key: { pk: item.pk, sk: item.sk },
          UpdateExpression: "SET gsi2pk = :pk, gsi2sk = :sk",
          ExpressionAttributeValues: {
            ":pk": "TASK_ALL",
            ":sk": `${item.createdAt}#${item.id}`,
          },
        }),
      );
      updated++;
    }
    lastKey = LastEvaluatedKey;
  } while (lastKey);
  console.log(`Migrated ${updated} tasks to GSI2`);
}

migrate().catch(console.error);
