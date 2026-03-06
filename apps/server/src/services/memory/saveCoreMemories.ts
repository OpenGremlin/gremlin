import { PutVectorsCommand } from "@aws-sdk/client-s3vectors";
import { logger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import type { CoreMemory } from "./getCoreMemories.js";
import { embed } from "./embed.js";
import { ensureVectorIndex } from "./ensure.js";

const log = logger.child({ component: "core-memories" });

export async function saveCoreMemories(
  ctx: ServiceContext,
  agentId: string,
  memories: CoreMemory[],
): Promise<void> {
  await ensureVectorIndex(ctx);

  const { client, bucketName } = ctx.resources.s3vectors;
  const key = `${agentId}:core`;
  const content = JSON.stringify(memories);

  // Embed the combined tenet text for potential semantic search
  const tenetsText = memories.map((m) => m.tenet).join("\n");
  const embedding = await embed(tenetsText || "no core memories");

  await client.send(
    new PutVectorsCommand({
      vectorBucketName: bucketName,
      indexName: "memories",
      vectors: [
        {
          key,
          data: { float32: embedding },
          metadata: {
            agentId,
            date: "core",
            content,
          },
        },
      ],
    }),
  );

  log.info({ agentId, count: memories.length }, "Saved core memories");
}
