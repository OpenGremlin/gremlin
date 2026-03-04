import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function delegateTaskTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Delegate a task to run in the background. Use this when the user's request involves work that can be done asynchronously (e.g., writing a document, research). The task runs in a separate thread and the user can check on it later.",
    inputSchema: z.object({
      title: z
        .string()
        .describe(
          'Short title for the task. Start with a verb and only uppercase the beginning, like a commit message (e.g. "Write a space cat story", "Research competitor pricing").',
        ),
      prompt: z.string().describe("Detailed instructions for the task"),
    }),
    execute: async ({ title, prompt }) => {
      const task = await ctx.services.tasks.createTask(ctx, {
        agentId,
        title,
      });

      // Fire-and-forget: AI picks an illustration for the task
      void ctx.services.tasks.selectAndSetTaskImage(ctx, task);

      // Enqueue to inbox — the consumer picks it up after the current turn
      await ctx.services.inbox.enqueueWork(ctx, agentId, {
        type: "run_task",
        payload: { taskId: task.id, prompt },
      });

      return { taskId: task.id, title };
    },
  });
}
