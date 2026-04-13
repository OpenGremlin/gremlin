import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function updateTaskMessageTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Post a short progress update for the current task. Call at meaningful milestones — not after every tool call.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A brief progress update — aim for under 10 words. Examples: 'Brainstorming characters', 'Writing first draft', 'Draft of epic story complete'.",
        ),
    }),
    execute: async ({ message }) => {
      await ctx.services.tasks.updateTaskMessage(ctx, taskId, message);
      return { taskId, message };
    },
  });
}
