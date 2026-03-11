import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function postToMainLaneTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Post a message to the main conversation on behalf of the agent. This is the only way to deliver your results to the user — they cannot see your task work directly. The message appears as a normal reply from you.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "The message to post. Write naturally as if replying to the user. Include key facts, answers, links, or a summary of what you created.",
        ),
    }),
    execute: async ({ message }) => {
      await ctx.services.tasks.postToMainLane(ctx, taskId, message);
      return { posted: true };
    },
  });
}
