import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import type { Attachment } from "../tasks/attachment.js";

const attachmentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("file"),
    path: z.string().describe("Relative workspace file path"),
  }),
  z.object({
    type: z.literal("link"),
    url: z.string().url(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
]);

/**
 * `replyToAssigner` lets a worker task send a message back to the agent that
 * assigned it. For background tasks (created via `backgroundTask`) the assigner
 * is the agent itself; for delegated tasks the assigner is a different agent
 * (the manager). Either way, the message is enqueued as a `task_update` inbox
 * event on the assigner's main lane and the assigner wakes up to process it.
 */
export function replyToAssignerTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Send a message back to the agent that assigned this task. " +
      "Use this any time you have something the assigner needs to know — " +
      "a partial finding, a clarifying question, a blocker, or your final " +
      "result. There is no requirement to send progress updates; for short " +
      "tasks one final message is normal. For long tasks, occasional updates " +
      "help the assigner stay informed. Always set `final: true` on your " +
      "last message. Attach files by path rather than pasting their contents.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A short, conversational message. Attached files are rendered " +
            "inline for the assigner, so just reference what you did rather " +
            'than repeating the content. e.g. "Completed report." or ' +
            '"Found 2 of 3 results, still searching for the third."',
        ),
      kind: z
        .enum(["progress", "question", "final"])
        .default("progress")
        .describe(
          "What kind of update this is. `progress` for routine status, " +
            "`question` if you need the assigner to weigh in, `final` for " +
            "your last message on this task.",
        ),
      final: z
        .boolean()
        .default(false)
        .describe(
          "Set to true on your last message. Marks the task complete and " +
            "tells the assigner you are done.",
        ),
      attachments: z
        .array(attachmentSchema)
        .optional()
        .describe(
          "Attachments to include with the message — files (documents, " +
            "screenshots, etc.) or links.",
        ),
    }),
    execute: async ({ message, kind, final, attachments }) => {
      const task = await ctx.services.tasks.getTask(ctx, taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);

      // Background tasks omit assignerAgentId — fall back to the worker.
      const assignerAgentId = task.assignerAgentId ?? task.agentId;
      const isFinal = final || kind === "final";

      await ctx.services.inbox.enqueueWork(ctx, assignerAgentId, "main", {
        type: "task_update",
        payload: {
          taskId,
          fromAgentId: task.agentId,
          message,
          kind: isFinal ? "final" : kind,
          isFinal,
          ...(attachments?.length
            ? { attachments: attachments as Attachment[] }
            : {}),
        },
      });

      if (isFinal) {
        await ctx.services.tasks.completeTask(ctx, taskId);
      }

      return { sent: true, isFinal };
    },
  });
}
