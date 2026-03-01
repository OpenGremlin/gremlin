import { tool } from "ai";
import { z } from "zod";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { AgentStatus, NotificationStatus } from "../../gql/resolverTypes.js";
import type { ServiceContext } from "../context.js";

export const webSearch = tool({
  description:
    "Search the web for information. Returns a summary of relevant results.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    // TODO: integrate real web search (e.g., Tavily, Brave Search)
    return { results: `[stub] Search results for: "${query}"` };
  },
});

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

export function requestApprovalTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Request approval from the user before proceeding. This will send a notification and pause your execution until the user responds.",
    inputSchema: z.object({
      type: z
        .enum(["PERMISSION", "APPROVAL"])
        .describe(
          "PERMISSION for requesting access to a new integration scope, APPROVAL for any other decision",
        ),
      message: z
        .string()
        .describe("Explain what you need and why you need it"),
      actions: z
        .array(
          z.object({
            id: z.string().describe("Unique action identifier"),
            label: z.string().describe("Button label shown to the user"),
            style: z
              .enum(["primary", "secondary"])
              .describe("primary for the recommended action, secondary for alternatives"),
          }),
        )
        .min(2)
        .describe("The choices to present to the user"),
    }),
    execute: async ({ type, message, actions }) => {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await ctx.resources.ddb.entities.Notification.build(PutItemCommand)
        .item({
          id,
          agentId,
          type,
          turnId: null,
          message,
          actions,
          status: NotificationStatus.Pending,
          resolvedAction: null,
          createdAt,
        })
        .send();

      await ctx.services.agents.updateAgentStatus(
        ctx,
        agentId,
        AgentStatus.Blocked,
      );

      return { blocked: true, notificationId: id };
    },
  });
}

export const defaultTools = { webSearch, sendEmail, checkInbox };
