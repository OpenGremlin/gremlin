import {
  GetVectorsCommand,
  QueryVectorsCommand,
} from "@aws-sdk/client-s3vectors";
import type { ServiceContext } from "../context.js";
import { embed } from "./embed.js";
import { ensureVectorIndex } from "./ensure.js";

export interface RecalledMemory {
  date: string;
  content: string;
  distance: number;
}

/**
 * Load recent journals (today + yesterday) and semantically search
 * older memories. Returns both combined.
 */
export async function recallMemories(
  ctx: ServiceContext,
  agentId: string,
  query: string,
  topK = 5,
): Promise<{ recent: RecalledMemory[]; relevant: RecalledMemory[] }> {
  await ensureVectorIndex(ctx);

  const { client, bucketName } = ctx.resources.s3vectors;

  // Load last 2 days of journals
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const recentKeys = [
    `${agentId}:${today.toISOString().slice(0, 10)}`,
    `${agentId}:${yesterday.toISOString().slice(0, 10)}`,
  ];

  const [recentResult, queryEmbedding] = await Promise.all([
    client
      .send(
        new GetVectorsCommand({
          vectorBucketName: bucketName,
          indexName: "memories",
          keys: recentKeys,
          returnMetadata: true,
        }),
      )
      .catch(() => null),
    embed(query),
  ]);

  const recent: RecalledMemory[] = [];
  if (recentResult?.vectors) {
    for (const v of recentResult.vectors) {
      const meta = v.metadata as Record<string, string> | undefined;
      if (meta?.content) {
        recent.push({
          date: meta.date ?? "unknown",
          content: meta.content,
          distance: 0,
        });
      }
    }
  }

  // Semantic search for older relevant memories
  const searchResult = await client.send(
    new QueryVectorsCommand({
      vectorBucketName: bucketName,
      indexName: "memories",
      queryVector: { float32: queryEmbedding },
      topK,
      filter: { agentId: { $eq: agentId } },
      returnMetadata: true,
      returnDistance: true,
    }),
  );

  const recentDateSet = new Set(recentKeys);
  const relevant: RecalledMemory[] = [];
  if (searchResult.vectors) {
    for (const v of searchResult.vectors) {
      // Skip entries already in recent
      if (v.key && recentDateSet.has(v.key)) continue;
      const meta = v.metadata as Record<string, string> | undefined;
      if (meta?.content) {
        relevant.push({
          date: meta.date ?? "unknown",
          content: meta.content,
          distance: v.distance ?? 1,
        });
      }
    }
  }

  return { recent, relevant };
}
