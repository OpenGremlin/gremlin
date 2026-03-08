import { tool } from "ai";
import { z } from "zod";

export const sendEmail = tool({
  description: "Send an email to a recipient.",
  inputSchema: z.object({
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Email body text"),
  }),
  execute: async ({ to, subject, body }) => {
    // TODO: integrate real email sending (e.g., SES, Gmail API)
    return { sent: true, to, subject, preview: body.slice(0, 100) };
  },
});

export const checkInbox = tool({
  description:
    "Check for new emails matching a filter. Returns matching messages.",
  inputSchema: z.object({
    filter: z.string().describe("Search filter (e.g., sender, subject)"),
  }),
  execute: async ({ filter }) => {
    // TODO: integrate real inbox polling (e.g., Gmail API)
    return {
      messages: [] as string[],
      filter,
      note: "[stub] No messages found",
    };
  },
});
