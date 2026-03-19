import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function attachLinkTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Attach a link to this task. Use this for any URL that is relevant to the task — a webpage you referenced, an article, a dashboard, an external resource, etc.",
    inputSchema: z.object({
      url: z.string().url().describe("The URL to attach"),
      title: z
        .string()
        .optional()
        .describe("A short title for the link (e.g. 'Sales Dashboard')"),
      description: z
        .string()
        .optional()
        .describe("Optional one-line description of what the link contains"),
    }),
    execute: async ({ url, title, description }) => {
      await ctx.services.tasks.addTaskAttachment(ctx, taskId, {
        type: "link",
        url,
        title,
        description,
      });
      return { attached: true, url };
    },
  });
}
