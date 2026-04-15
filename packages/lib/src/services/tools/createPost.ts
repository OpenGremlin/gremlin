import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function createPostTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Create a post to the home feed summarizing completed work. " +
      "Call this when a top-level task completes. Write a concise title and " +
      "a message of a few sentences describing what was accomplished. " +
      "Attachments are collected automatically from the task and all subtasks.",
    inputSchema: z.object({
      taskId: z.string().describe("The completed task ID"),
      title: z.string().describe("Short title for the post"),
      message: z
        .string()
        .describe("A few sentences summarizing the work completed"),
    }),
    execute: async ({ taskId, title, message }) => {
      const post = await ctx.services.posts.createPost(ctx, {
        agentId,
        taskId,
        title,
        message,
      });
      return { postId: post.id, title: post.title };
    },
  });
}
