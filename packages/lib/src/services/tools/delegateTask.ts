import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function delegateTaskTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Delegate work to a background task. The task runs asynchronously with access to a sandbox shell, MCP skills, and document tools. Use for: sandbox/shell work, bulk file processing, multi-step workflows, or anything requiring skills. Include all relevant context and file paths in the prompt — the task cannot see the conversation history.",
    inputSchema: z.object({
      title: z
        .string()
        .describe(
          'Short title for the task. Start with a verb and only uppercase the beginning, like a commit message (e.g. "Write a space cat story", "Research competitor pricing").',
        ),
      prompt: z
        .string()
        .describe(
          "Detailed instructions for the task. Include all necessary context, file paths, and requirements — the task runs independently and cannot see the main conversation.",
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
          "Files or links to pass to the task. Use this to forward uploaded images, documents, or URLs that the task needs to access. File paths are relative to the workspace.",
        ),
    }),
    execute: async ({ title, prompt, attachments }) => {
      const task = await ctx.services.tasks.createTask(ctx, {
        agentId,
        title,
      });

      // Fire-and-forget: AI picks an illustration for the task
      void ctx.services.tasks.selectAndSetTaskImage(ctx, task);

      // Enqueue to inbox — the consumer picks it up after the current turn
      await ctx.services.inbox.enqueueWork(ctx, agentId, `task:${task.id}`, {
        type: "run_task",
        payload: {
          taskId: task.id,
          prompt,
          ...(attachments?.length ? { attachments } : {}),
        },
      });

      return { taskId: task.id, title };
    },
  });
}
