import { GetVectorsCommand } from "@aws-sdk/client-s3vectors";
import { generateText } from "ai";
import { logger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import { getModel } from "../orchestrator/model.js";
import { ensureVectorIndex } from "./ensure.js";
import type { CoreMemory } from "./getCoreMemories.js";
import { getCoreMemories } from "./getCoreMemories.js";
import { buildReviewPrompt, parseReviewResponse } from "./reviewHelpers.js";
import { saveCoreMemories } from "./saveCoreMemories.js";

const log = logger.child({ component: "core-memories" });

/**
 * Daily review: fetch yesterday's memories + current core memories,
 * ask the LLM to synthesize updated core memories.
 */
export async function reviewCoreMemories(
  ctx: ServiceContext,
  agentId: string,
): Promise<CoreMemory[]> {
  await ensureVectorIndex(ctx);
  if (!ctx.resources.s3vectors) return [];

  const { client, bucketName } = ctx.resources.s3vectors;

  // Fetch yesterday's memory entry
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${agentId}:${yesterday.toISOString().slice(0, 10)}`;

  let yesterdayContent = "";
  try {
    const result = await client.send(
      new GetVectorsCommand({
        vectorBucketName: bucketName,
        indexName: "memories",
        keys: [yesterdayKey],
        returnMetadata: true,
      }),
    );
    const meta = result.vectors?.[0]?.metadata as
      | Record<string, string>
      | undefined;
    if (meta?.content) {
      yesterdayContent = meta.content;
    }
  } catch {
    // No memories from yesterday
  }

  // Fetch current core memories
  const currentCore = await getCoreMemories(ctx, agentId);

  // If there are no yesterday memories and no existing core memories, nothing to do
  if (!yesterdayContent && currentCore.length === 0) {
    log.info(
      { agentId },
      "No memories to review — skipping core memory update",
    );
    return [];
  }

  // Call LLM to review and update
  const model = await getModel(ctx);

  const prompt = buildReviewPrompt(currentCore, yesterdayContent);

  const result = await generateText({
    model,
    system:
      "You maintain a set of core memories — long-term behavioral tenets derived from daily experiences. Respond with ONLY a JSON array, no markdown fences or explanation.",
    messages: [{ role: "user", content: prompt }],
  });

  // Parse the LLM response
  const updated = parseReviewResponse(result.text, currentCore);

  // Save
  await saveCoreMemories(ctx, agentId, updated);

  log.info(
    { agentId, previous: currentCore.length, updated: updated.length },
    "Core memory review complete",
  );

  return updated;
}
