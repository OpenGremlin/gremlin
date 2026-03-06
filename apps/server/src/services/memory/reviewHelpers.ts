import { logger } from "../../logger.js";
import type { CoreMemory } from "./getCoreMemories.js";

const log = logger.child({ component: "core-memories" });

export function buildReviewPrompt(
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

export function parseReviewResponse(
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
