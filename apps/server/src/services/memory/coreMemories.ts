import {
  GetVectorsCommand,
  PutVectorsCommand,
} from "@aws-sdk/client-s3vectors";
import { generateText } from "ai";
import { logger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import { getModel } from "../orchestrator/model.js";
import { embed } from "./embed.js";
import { ensureVectorIndex } from "./ensure.js";

export interface CoreMemory {
  tenet: string;
  shapedBy: string[];
}

const log = logger.child({ component: "core-memories" });

export async function getCoreMemories(
  ctx: ServiceContext,
  agentId: string,
): Promise<CoreMemory[]> {
  await ensureVectorIndex(ctx);

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

/**
 * Daily review: fetch yesterday's memories + current core memories,
 * ask the LLM to synthesize updated core memories.
 */
export async function reviewCoreMemories(
  ctx: ServiceContext,
  agentId: string,
): Promise<CoreMemory[]> {
  await ensureVectorIndex(ctx);

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
    messages: [
      {
        role: "system",
        content:
          "You maintain a set of core memories — long-term behavioral tenets derived from daily experiences. Respond with ONLY a JSON array, no markdown fences or explanation.",
      },
      { role: "user", content: prompt },
    ],
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

function buildReviewPrompt(
  currentCore: CoreMemory[],
  yesterdayContent: string,
): string {
  const parts: string[] = [];

  if (currentCore.length > 0) {
    parts.push("## Current core memories");
    parts.push(JSON.stringify(currentCore, null, 2));
  } else {
    parts.push("## Current core memories\nNone yet.");
  }

  if (yesterdayContent) {
    parts.push("\n## Yesterday's memories");
    parts.push(yesterdayContent);
  } else {
    parts.push("\n## Yesterday's memories\nNo new memories from yesterday.");
  }

  parts.push(`
## Instructions

Review the current core memories and yesterday's experiences. Produce an updated set of core memories.

Rules:
- Maximum 10 core memories (can be fewer, or none if nothing is noteworthy)
- Each core memory has a "tenet" (a concise behavioral principle about the user) and "shapedBy" (specific memory excerpts that led to this tenet)
- You may add new tenets if yesterday's memories reveal a clear pattern or preference
- You may reinforce existing tenets by adding new supporting memories to "shapedBy"
- You may update a tenet's wording if new evidence refines it
- You may remove a tenet if it seems outdated, contradicted, or no longer relevant
- If yesterday had no memories, only remove outdated tenets or return the existing set unchanged
- Tenets should be about the user's preferences, habits, values, or behavioral patterns — not facts about the world
- Keep tenets concise (1 sentence)
- Keep shapedBy entries brief but specific enough to understand context

Respond with ONLY a JSON array of objects with "tenet" and "shapedBy" fields.`);

  return parts.join("\n");
}

function parseReviewResponse(
  text: string,
  fallback: CoreMemory[],
): CoreMemory[] {
  try {
    // Strip markdown fences if present
    const cleaned = text
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      log.warn("LLM response is not an array — keeping existing core memories");
      return fallback;
    }

    // Validate and clamp to 10
    const validated: CoreMemory[] = [];
    for (const item of parsed.slice(0, 10)) {
      if (
        typeof item.tenet === "string" &&
        Array.isArray(item.shapedBy) &&
        item.shapedBy.every((s: unknown) => typeof s === "string")
      ) {
        validated.push({
          tenet: item.tenet,
          shapedBy: item.shapedBy,
        });
      }
    }

    return validated;
  } catch (err) {
    log.error(
      { err, text: text.slice(0, 200) },
      "Failed to parse core memory review response",
    );
    return fallback;
  }
}
