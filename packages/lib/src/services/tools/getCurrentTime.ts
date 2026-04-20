import { tool } from "ai";
import { z } from "zod";
import { toolOk, wrapExecute } from "./toolResult.js";

/**
 * Returns the current wall-clock time in a given IANA timezone.
 *
 * This exists as a tool (instead of being baked into the system prompt) so
 * the time string never appears in the cached prefix. A date-in-prompt
 * would otherwise invalidate the cache every day at local midnight.
 */
export function getCurrentTimeTool(defaultTimezone?: string) {
  return tool({
    description:
      "Get the current date and time. Call this when you need to know what day or time it is (scheduling, recency, greetings, etc.). Without calling, you have no direct access to the current time.",
    inputSchema: z.object({
      timezone: z
        .string()
        .optional()
        .describe(
          "IANA timezone (e.g. 'America/New_York'). Defaults to the user's configured timezone.",
        ),
    }),
    execute: wrapExecute("getCurrentTime", async ({ timezone }) => {
      const tz = timezone ?? defaultTimezone ?? "UTC";
      const now = new Date();
      const iso = now.toISOString();
      const formatted = now.toLocaleString("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
      return toolOk({ iso, formatted, timezone: tz });
    }),
  });
}
