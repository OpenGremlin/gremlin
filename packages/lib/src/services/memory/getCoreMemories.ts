import { GetVectorsCommand } from "@aws-sdk/client-s3vectors";
import type { ServiceContext } from "../context.js";
import { ensureVectorIndex } from "./ensure.js";

export interface CoreMemory {
  tenet: string;
  shapedBy: string[];
}

export async function getCoreMemories(
  ctx: ServiceContext,
  agentId: string,
): Promise<CoreMemory[]> {
  await ensureVectorIndex(ctx);
  if (!ctx.resources.s3vectors) return [];

  const { client, bucketName } = ctx.resources.s3vectors;
  const key = `${agentId}:core`;

  try {
    const result = await client.send(
      new GetVectorsCommand({
        vectorBucketName: bucketName,
        indexName: "memories",
        keys: [key],
        returnMetadata: true,
      }),
    );

    const meta = result.vectors?.[0]?.metadata as
      | Record<string, string>
      | undefined;
    if (meta?.content) {
      return JSON.parse(meta.content) as CoreMemory[];
    }
  } catch {
    // Not found yet — that's fine
  }

  return [];
}
