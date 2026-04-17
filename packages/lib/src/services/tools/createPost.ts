import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import { toolOk, wrapExecute } from "./toolResult.js";

export function createPostTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Create a post to the home feed summarizing completed work. " +
      "Call this when a top-level task completes. " +
      "Attachments are collected automatically from the task and all subtasks.",
    inputSchema: z.object({
      taskId: z.string().describe("The completed task ID"),
      title: z.string().describe("Short title for the post (under 15 words)"),
      message: z
        .string()
        .describe(
          "Brief summary of what was done, about 25 words. " +
            "Be direct and specific — state the outcome, not the process.",
        ),
    }),
    execute: wrapExecute("createPost", async ({ taskId, title, message }) => {
      const post = await ctx.services.posts.createPost(ctx, {
        agentId,
        taskId,
        title,
        message,
      });
      return toolOk({ postId: post.id, title: post.title });
    }),
  });
}
