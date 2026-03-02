import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { PutVectorsCommand } from "@aws-sdk/client-s3vectors";
import type { ServiceContext } from "../context.js";
import { embed } from "./embed.js";
import { ensureVectorIndex } from "./ensure.js";

function slugify(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveMemory(
  ctx: ServiceContext,
  agentId: string,
  topic: string,
  content: string,
): Promise<{ topic: string; saved: boolean }> {
  await ensureVectorIndex(ctx);

  const slug = slugify(topic);
  const table = ctx.resources.ddb.table;
  const tableName = table.getName();

  // Check if topic exists
  const pk = "MEMORY_TOPIC";
  const sk = `MEMORY_TOPIC#${agentId}#${slug}`;

  const { Item: existing } = await table.getDocumentClient().send(
    new GetCommand({ TableName: tableName, Key: { pk, sk } }),
  );

  // Append if exists, otherwise use new content
  const fullContent = existing
    ? `${existing.content}\n${content}`
    : content;

  const now = new Date().toISOString();

  // Upsert to DDB with GSI keys
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk,
        sk,
        agentId,
        topic: slug,
        content: fullContent,
        updatedAt: now,
        _et: "MemoryTopic",
        gsi1pk: `MEM_AGENT#${agentId}`,
        gsi1sk: now,
      },
    }),
  );

  // Embed the full topic content and upsert to S3 Vectors
  const vectorKey = `${agentId}:${slug}`;
  const embedding = await embed(`${slug}: ${fullContent}`);

  const { client, bucketName } = ctx.resources.s3vectors;
  await client.send(
    new PutVectorsCommand({
      vectorBucketName: bucketName,
      indexName: "memories",
      vectors: [
        {
          key: vectorKey,
          data: { float32: embedding },
          metadata: {
            agentId,
            topic: slug,
            content: fullContent,
          },
        },
      ],
    }),
  );

  return { topic: slug, saved: true };
}
