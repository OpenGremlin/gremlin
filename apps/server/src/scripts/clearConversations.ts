import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
const docClient = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE_NAME || "gremlin";

async function clearPartition(pk: string) {
  let deleted = 0;
  let lastKey: Record<string, unknown> | undefined;

  do {
    const { Items, LastEvaluatedKey } = await docClient.send(
      new QueryCommand({
        TableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": pk },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of Items ?? []) {
      await docClient.send(
        new DeleteCommand({ TableName, Key: { pk: item.pk, sk: item.sk } }),
      );
      deleted++;
    }
    lastKey = LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return deleted;
}

async function main() {
  for (const pk of ["AGENT_LOG", "TASK", "DOCUMENT"]) {
    const count = await clearPartition(pk);
    console.log(`Cleared ${count} ${pk} records`);
  }
  console.log("Done. Conversations wiped.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
