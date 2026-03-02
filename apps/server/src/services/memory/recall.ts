import { QueryVectorsCommand } from "@aws-sdk/client-s3vectors";
import type { ServiceContext } from "../context.js";
import { embed } from "./embed.js";
import { ensureVectorIndex } from "./ensure.js";

export interface RecalledMemory {
  topic: string;
  content: string;
  distance: number;
}

export async function recallMemories(
  ctx: ServiceContext,
  agentId: string,
  query: string,
  topK = 5,
): Promise<RecalledMemory[]> {
  await ensureVectorIndex(ctx);

  const queryEmbedding = await embed(query);

  const { client, bucketName } = ctx.resources.s3vectors;
  const result = await client.send(
    new QueryVectorsCommand({
      vectorBucketName: bucketName,
      indexName: "memories",
      queryVector: { float32: queryEmbedding },
      topK,
      filter: { agentId: { eq: agentId } },
      returnMetadata: true,
      returnDistance: true,
    }),
  );

  if (!result.vectors?.length) return [];

  return result.vectors.map((v) => {
    const meta = v.metadata as Record<string, string> | undefined;
    return {
      topic: meta?.topic ?? "unknown",
      content: meta?.content ?? "",
      distance: v.distance ?? 1,
    };
  });
}
