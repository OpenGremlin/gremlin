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
      "Post a message to the main conversation on behalf of the agent. " +
      "The message appears as a reply from you in the main chat. " +
      "Attach files by path rather than pasting their contents into the message.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A short, conversational message. " +
            "Attached files are rendered inline for the user, so just reference " +
            "what you did rather than repeating the content. " +
            'e.g. "Here\'s the podcast episode." or "Done — report attached."',
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
