import {
  GetVectorsCommand,
  PutVectorsCommand,
} from "@aws-sdk/client-s3vectors";
import type { ServiceContext } from "../context.js";
import { embed } from "./embed.js";
import { ensureVectorIndex } from "./ensure.js";

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function saveMemory(
  ctx: ServiceContext,
  agentId: string,
  content: string,
): Promise<{ date: string; saved: boolean }> {
  await ensureVectorIndex(ctx);
  if (!ctx.resources.s3vectors) return { date: todayStamp(), saved: false };

  const date = todayStamp();
  const vectorKey = `${agentId}:${date}`;
  const { client, bucketName } = ctx.resources.s3vectors;

  // Read existing journal for today
  let existing = "";
  try {
    const result = await client.send(
      new GetVectorsCommand({
        vectorBucketName: bucketName,
        indexName: "memories",
        keys: [vectorKey],
        returnMetadata: true,
      }),
    );
    const meta = result.vectors?.[0]?.metadata as
      | Record<string, string>
      | undefined;
    if (meta?.content) {
      existing = meta.content;
    }
  } catch {
    // Vector doesn't exist yet — that's fine
  }

  const fullContent = existing ? `${existing}\n${content}` : content;

  const embedding = await embed(fullContent);

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
            date,
            content: fullContent,
          },
        },
      ],
    }),
  );

  return { date, saved: true };
}
