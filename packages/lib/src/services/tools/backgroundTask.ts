import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function backgroundTaskTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Continue working on a request in the background with access to tools " +
      "(file editing, sandbox, web search, skills). The task inherits the " +
      "conversation context automatically — just describe what to do.",
    inputSchema: z.object({
      title: z
        .string()
        .describe(
          'Short title for the task. Start with a verb, like a commit message (e.g. "Create space podcast", "Research competitor pricing").',
        ),
      prompt: z
        .string()
        .optional()
        .describe(
          "Optional additional instructions beyond what's already in the conversation. " +
            "Only needed if you want to add specific constraints or details " +
            "that weren't discussed. The task can see the full conversation.",
        ),
      attachments: z
        .array(
          z.object({
            type: z.enum(["file", "link"]),
            path: z.string().optional(),
            url: z.string().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
          }),
        )
        .optional()
        .describe(
          "Files or links to pass to the task. Use this to forward uploaded images, documents, or URLs.",
        ),
    }),
    execute: async ({ title, prompt, attachments }) => {
      const task = await ctx.services.tasks.createTask(ctx, {
        agentId,
        title,
      });

      // Fire-and-forget: AI picks an emoji for the task
      void ctx.services.tasks.selectAndSetTaskEmoji(ctx, task);

      // Enqueue to inbox — the consumer picks it up after the current turn
      await ctx.services.inbox.enqueueWork(ctx, agentId, `task:${task.id}`, {
        type: "run_task",
        payload: {
          taskId: task.id,
          prompt: prompt ?? "",
          ...(attachments?.length ? { attachments } : {}),
        },
      });

      return { taskId: task.id, title };
    },
  });
}
