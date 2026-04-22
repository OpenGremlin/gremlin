import { tool } from "ai";
import { z } from "zod";
import type { CanvasNode } from "../canvas/index.js";
import type { ServiceContext } from "../context.js";
import { toolErr, toolOk, wrapExecute } from "./toolResult.js";

/**
 * Cap on the string we persist per canvas.show call. DynamoDB items top
 * out at 400 KB total; we're well under that but chatty agents can
 * still stuff megabytes of tool output into `context`, which bloats
 * the table and the SSE payload. Truncate with a note.
 */
export const MAX_CANVAS_CONTENT_BYTES = 16 * 1024;

function truncateToBytes(s: string, limit: number): string {
  if (Buffer.byteLength(s, "utf8") <= limit) return s;
  // Trim by chars conservatively (1 char ≤ 4 bytes in UTF-8), then
  // walk back until we fit with a " …(truncated)" suffix.
  const suffix = "\n\n…(truncated)";
  const suffixBytes = Buffer.byteLength(suffix, "utf8");
  let out = s.slice(0, Math.floor((limit - suffixBytes) / 4));
  while (Buffer.byteLength(out, "utf8") > limit - suffixBytes) {
    out = out.slice(0, -64);
  }
  return out + suffix;
}

/**
 * Translate a free-form intent + raw context into a CanvasNode. v1 is
 * a deterministic fast-path: if the context is clearly an image or a
 * code block, emit the matching node; otherwise fall back to a text
 * node containing the intent and a pretty-printed context dump.
 *
 * The real UI subagent (Haiku-class, A2UI-aware) is deferred; when it
 * lands it replaces this function.
 *
 * Exported for testing.
 */
export function intentToNode(intent: string, context: unknown): CanvasNode {
  if (context && typeof context === "object") {
    const c = context as Record<string, unknown>;
    if (typeof c.imageUrl === "string") {
      return {
        type: "image",
        url: c.imageUrl,
        alt: typeof c.alt === "string" ? c.alt : intent,
      };
    }
    if (typeof c.code === "string") {
      return {
        type: "code",
        lang: typeof c.lang === "string" ? c.lang : undefined,
        content: truncateToBytes(c.code, MAX_CANVAS_CONTENT_BYTES),
      };
    }
  }
  const contextStr =
    context === undefined
      ? ""
      : typeof context === "string"
        ? context
        : JSON.stringify(context, null, 2);
  const raw = contextStr ? `${intent}\n\n${contextStr}` : intent;
  return {
    type: "text",
    content: truncateToBytes(raw, MAX_CANVAS_CONTENT_BYTES),
  };
}

export function canvasShowTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description: `Show something on the user's canvas — a big-screen surface the user is casting to from their phone. Use this when you've produced a visual artifact (image, chart, code block, important result) worth surfacing beyond the chat.

Call sparingly. Most agent output belongs in the chat; the canvas is for things the user would want to *look at* on a larger screen.

- intent: a short description of what you're showing, e.g. "The chart I generated comparing Q1 vs Q2 revenue"
- context (optional): raw data you want rendered. Common shapes:
  - { imageUrl, alt? } — renders as an image
  - { code, lang? } — renders as a syntax-highlighted code block
  - any other JSON — rendered as a text summary under the intent`,
    inputSchema: z.object({
      intent: z.string().describe("What you want to show on the canvas"),
      context: z
        .unknown()
        .optional()
        .describe("Raw data — image URL, code, structured JSON"),
    }),
    execute: wrapExecute("canvasShow", async ({ intent, context }) => {
      const userId = ctx.user?.sub;
      if (!userId) {
        return toolErr("INTERNAL_ERROR", "No authenticated user");
      }
      const root = intentToNode(intent, context);
      const tree = await ctx.services.canvas.saveCanvasState(
        ctx.resources,
        agentId,
        userId,
        root,
      );
      return toolOk({ rendered: true, revision: tree.revision });
    }),
  });
}

export function canvasClearTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Clear whatever is currently on the user's canvas. Use when the thing you showed is no longer relevant.",
    inputSchema: z.object({}),
    execute: wrapExecute("canvasClear", async () => {
      const userId = ctx.user?.sub;
      if (!userId) {
        return toolErr("INTERNAL_ERROR", "No authenticated user");
      }
      await ctx.services.canvas.clearCanvasState(
        ctx.resources,
        agentId,
        userId,
      );
      return toolOk({ cleared: true });
    }),
  });
}
