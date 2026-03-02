import { tool } from "ai";
import { z } from "zod";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
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

      const table = ctx.resources.ddb.table;
      await table.getDocumentClient().send(
        new PutCommand({
          TableName: table.getName(),
          Item: {
            id,
            agentId,
            type,
            turnId: null,
            message,
            actions,
            status: NotificationStatus.Pending,
            resolvedAction: null,
            createdAt,
            _et: "Notification",
            pk: "NOTIFICATION",
            sk: `NOTIFICATION#${id}`,
            gsi1pk: `NOTIF_STATUS#${NotificationStatus.Pending}`,
            gsi1sk: createdAt,
          },
        }),
      );

      await ctx.services.agents.updateAgentStatus(
        ctx,
        agentId,
        AgentStatus.Blocked,
      );

      return { blocked: true, notificationId: id };
    },
  });
}

export function delegateTaskTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Delegate a task to run in the background. Use this when the user's request involves work that can be done asynchronously (e.g., writing a document, research). The task runs in a separate thread and the user can check on it later.",
    inputSchema: z.object({
      title: z.string().describe("Short title for the task"),
      prompt: z.string().describe("Detailed instructions for the task"),
    }),
    execute: async ({ title, prompt }) => {
      const task = await ctx.services.tasks.createTask(ctx, {
        agentId,
        title,
      });

      // Fire-and-forget the task lane
      ctx.services.orchestrator
        .runTaskLane(ctx, task.id, prompt)
        .catch((err) => console.error("delegateTask runTaskLane failed:", err));

      return { taskId: task.id, title };
    },
  });
}

export function updateTaskStatusTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Update the status of the current task. You MUST call this tool every time you make meaningful progress — not just at the end. Include a short, human-readable message summarizing what you just did or are about to do. Call with COMPLETED when you are done.",
    inputSchema: z.object({
      status: z
        .enum(["RUNNING", "WAITING", "COMPLETED", "FAILED", "ABANDONED"])
        .describe("The new task status"),
      message: z
        .string()
        .describe(
          "REQUIRED. A brief status update — aim for under 10 words. Examples: 'Brainstorming characters', 'Writing first draft', 'Polishing final version', 'Done — 1,200 words'.",
        ),
    }),
    execute: async ({ status, message }) => {
      await ctx.services.tasks.updateTaskStatus(
        ctx,
        taskId,
        status,
        message,
      );
      return { taskId, status, message };
    },
  });
}

export function createDocumentTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Create a new document artifact attached to this task. Use this for any substantial written output (stories, reports, plans, etc.).",
    inputSchema: z.object({
      title: z.string().describe("Document title"),
      body: z.string().describe("Document body in markdown"),
    }),
    execute: async ({ title, body }) => {
      const doc = await ctx.services.documents.createDocument(ctx, {
        title,
        body,
      });
      await ctx.services.tasks.addTaskArtifact(ctx, taskId, doc.id);
      return { id: doc.id, title };
    },
  });
}

export function updateDocumentTool(ctx: ServiceContext) {
  return tool({
    description:
      "Update an existing document. Use this to revise or expand a document you previously created.",
    inputSchema: z.object({
      id: z.string().describe("The document ID to update"),
      title: z.string().optional().describe("New title (optional)"),
      body: z.string().optional().describe("New body in markdown (optional)"),
    }),
    execute: async ({ id, title, body }) => {
      const doc = await ctx.services.documents.getDocument(ctx, id);
      if (!doc) throw new Error(`Document ${id} not found`);
      await ctx.services.documents.updateDocument(ctx, id, {
        title: title ?? doc.title,
        body: body ?? doc.body,
      });
      return { id, title: title ?? doc.title };
    },
  });
}

export const defaultTools = { webSearch, sendEmail, checkInbox };
