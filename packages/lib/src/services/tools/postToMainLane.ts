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

export function postToMainLaneTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Post a message to the main conversation on behalf of the agent. This is the only way to deliver your results to the user — they cannot see your task work directly. The message appears as a normal reply from you. Attach any documents, files, or links you want the user to see inline.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A short, conversational message to the user. Keep it brief (1-2 sentences). " +
            "Do NOT repeat or summarize content that is already in the attachments — " +
            "the user can see attached files and documents directly. " +
            'Just say what you did, e.g. "Here\'s the report you asked for." or ' +
            '"Done — I updated the design doc with the new sections."',
        ),
      attachments: z
        .array(attachmentSchema)
        .optional()
        .describe(
          "Attachments to include with the message — files (documents, screenshots, etc.) or links.",
        ),
    }),
    execute: async ({ message, attachments }) => {
      await ctx.services.tasks.postToMainLane(
        ctx,
        taskId,
        message,
        attachments as Attachment[] | undefined,
      );
      return { posted: true };
    },
  });
}
