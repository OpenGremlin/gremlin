import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function updateTaskMessageTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Post a short progress update for the current task. Call this frequently as you work — the user sees these messages in real time.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A brief progress update — aim for under 10 words. Examples: 'Brainstorming characters', 'Writing first draft', 'Polishing final version', 'Done — 1,200 words'.",
        ),
    }),
    execute: async ({ message }) => {
      await ctx.services.tasks.updateTaskMessage(ctx, taskId, message);
      return { taskId, message };
    },
  });
}
