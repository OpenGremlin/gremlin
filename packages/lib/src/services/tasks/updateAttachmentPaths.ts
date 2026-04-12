import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";

interface RawAttachmentRow {
  pk: string;
  sk: string;
  path: string;
}

/**
 * After a file or directory move, update all attachment items whose path
 * matches `oldPath` exactly or is nested under `oldPath/`.
 *
 * Because path is NOT in pk/sk, this is a simple in-place UpdateCommand.
 */
export async function updateAttachmentPaths(
  ctx: ServiceContext,
  oldPath: string,
  newPath: string,
): Promise<number> {
  const table = ctx.resources.ddb.table;
  const tableName = table.getName();
  const docClient = table.getDocumentClient();

  // Query GSI2 for all file attachments matching the old path prefix.
  // begins_with covers both exact file match and directory children.
  let lastKey: Record<string, unknown> | undefined;
  let updated = 0;

  do {
    const { Items, LastEvaluatedKey } = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "gsi2",
        KeyConditionExpression: "gsi2pk = :pk AND begins_with(gsi2sk, :prefix)",
        ExpressionAttributeValues: {
          ":pk": "ATTACHMENT_FILE",
          ":prefix": oldPath,
        },
        ...(lastKey && { ExclusiveStartKey: lastKey }),
      }),
    );

    for (const raw of (Items ?? []) as RawAttachmentRow[]) {
      // Guard against false prefix matches (e.g. "foo.txt" matching "foo.txt.bak").
      // Only update if the path equals oldPath exactly or is under oldPath/.
      if (raw.path !== oldPath && !raw.path.startsWith(`${oldPath}/`)) {
        continue;
      }

      const updatedPath = newPath + raw.path.slice(oldPath.length);

      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: raw.pk, sk: raw.sk },
          UpdateExpression:
            "SET #path = :newPath, gsi2sk = :newPath, dedupKey = :dk",
          ExpressionAttributeNames: { "#path": "path" },
          ExpressionAttributeValues: {
            ":newPath": updatedPath,
            ":dk": `file:${updatedPath}`,
          },
        }),
      );

      updated++;
    }

    lastKey = LastEvaluatedKey;
  } while (lastKey);

  return updated;
}
