import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function postToMainLaneTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Post a message to the main conversation on behalf of the agent. This is the only way to deliver your results to the user — they cannot see your task work directly. The message appears as a normal reply from you. Attach any document paths you created so the user can view them inline.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "The message to post. Write naturally as if replying to the user. Include key facts, answers, links, or a summary of what you created.",
        ),
      artifacts: z
        .array(z.string())
        .optional()
        .describe(
          "File paths of documents created during this task (from createDocument results). These will be shown as viewable cards attached to your message.",
        ),
    }),
    execute: async ({ message, artifacts }) => {
      await ctx.services.tasks.postToMainLane(ctx, taskId, message, artifacts);
      return { posted: true };
    },
  });
}
