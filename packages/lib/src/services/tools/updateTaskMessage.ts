import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function updateTaskMessageTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Post a short progress update for the current task. Call at meaningful milestones — not after every tool call. Set completed=true when all work is finished.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A brief progress update — aim for under 10 words. Examples: 'Brainstorming characters', 'Writing first draft', 'Draft of epic story complete'.",
        ),
      completed: z
        .boolean()
        .optional()
        .describe(
          "Set to true when the task is finished (success or failure). This marks the task as done in the UI.",
        ),
    }),
    execute: async ({ message, completed }) => {
      await ctx.services.tasks.updateTaskMessage(ctx, taskId, message, {
        completed,
      });
      return { taskId, message, completed };
    },
  });
}
