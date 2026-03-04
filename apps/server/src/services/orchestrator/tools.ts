import * as fs from "node:fs/promises";
import * as path from "node:path";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { tool } from "ai";
import { z } from "zod";
import { NotificationStatus } from "../../gql/resolverTypes.js";
import type { ServiceContext } from "../context.js";
import { applyPatches } from "./applyPatches.js";

function getWorkspacePath() {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function uniqueFilePath(dir: string, slug: string): Promise<string> {
  let candidate = path.join(dir, `${slug}.md`);
  let i = 1;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${slug}-${i}.md`);
      i++;
    } catch {
      return candidate;
    }
  }
}

function parseFrontmatter(content: string): { title: string; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { title: "", body: content };
  const frontmatter = match[1];
  const body = match[2];
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
  return { title: titleMatch?.[1]?.trim() ?? "", body };
}

function formatWithFrontmatter(title: string, body: string): string {
  return `---\ntitle: ${title}\n---\n${body}`;
}

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
      message: z.string().describe("Explain what you need and why you need it"),
      actions: z
        .array(
          z.object({
            id: z.string().describe("Unique action identifier"),
            label: z.string().describe("Button label shown to the user"),
            style: z
              .enum(["primary", "secondary"])
              .describe(
                "primary for the recommended action, secondary for alternatives",
              ),
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

      return { blocked: true, notificationId: id };
    },
  });
}

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

export function updateTaskMessageTool(ctx: ServiceContext, taskId: string) {
  return tool({
    description:
      "Post a short progress update for the current task. Call this frequently as you work — the user sees these messages in real time.",
    inputSchema: z.object({
      message: z
        .string()
        .describe(
          "A brief progress update — aim for under 10 words. Examples: 'Brainstorming characters', 'Writing first draft', 'Polishing final version', 'Done — 1,200 words'.",
        ),
    }),
    execute: async ({ message }) => {
      await ctx.services.tasks.updateTaskMessage(ctx, taskId, message);
      return { taskId, message };
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
      const workspace = getWorkspacePath();
      const docsDir = path.join(workspace, "documents");
      await fs.mkdir(docsDir, { recursive: true });

      const slug = slugify(title);
      const filePath = await uniqueFilePath(docsDir, slug);
      const relativePath = path.relative(workspace, filePath);

      await fs.writeFile(filePath, formatWithFrontmatter(title, body), "utf-8");
      await ctx.services.tasks.addTaskArtifact(ctx, taskId, relativePath);
      return { path: relativePath, title };
    },
  });
}

export function updateDocumentTool(ctx: ServiceContext) {
  return tool({
    description:
      "Update an existing document by applying patches. Send old_text/new_text pairs instead of the full body. To replace text, set old_text to the existing text and new_text to the replacement. To delete text, set new_text to an empty string. To insert text, include surrounding text in old_text and add the new content in new_text.",
    inputSchema: z.object({
      path: z.string().describe("The document file path to update"),
      title: z.string().optional().describe("New title (optional)"),
      patches: z
        .array(
          z.object({
            old_text: z
              .string()
              .describe("The existing text to find in the document"),
            new_text: z
              .string()
              .describe("The replacement text (empty string to delete)"),
          }),
        )
        .min(1)
        .describe("Array of patches to apply sequentially"),
    }),
    execute: async ({ path: filePath, title, patches }) => {
      const workspace = getWorkspacePath();
      const resolved = path.resolve(workspace, filePath);
      if (!resolved.startsWith(workspace)) {
        throw new Error("Path traversal not allowed");
      }

      const content = await fs.readFile(resolved, "utf-8");
      const parsed = parseFrontmatter(content);
      const newBody = applyPatches(parsed.body, patches);
      const newTitle = title ?? parsed.title;

      await fs.writeFile(
        resolved,
        formatWithFrontmatter(newTitle, newBody),
        "utf-8",
      );
      return { path: filePath, title: newTitle };
    },
  });
}

export function saveMemoryTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description: `Save information to long-term memory. Entries are appended to today's journal and automatically recalled in future conversations via semantic search.

When to save:
- User explicitly asks you to remember something ("remember this", "note that", "keep in mind")
- You learn a user preference (communication style, formatting, timezone, likes/dislikes)
- An important decision is made or a plan is agreed upon
- You discover project context that would be useful later (tech stack, conventions, key contacts)
- A task produces a noteworthy outcome or lesson learned
- User corrects you — save the correction so you don't repeat the mistake

Examples of good entries:
- "User prefers concise responses — no bullet points unless asked"
- "Project uses pnpm, not npm. Monorepo with apps/ and packages/ dirs"
- "User's dog is named Mochi. Mention him occasionally"
- "Decided to use Postgres over DynamoDB for the analytics service"
- "User works 9am-5pm PST, prefers async task delegation outside those hours"`,
    inputSchema: z.object({
      content: z
        .string()
        .describe("The information to remember — be specific and concise"),
    }),
    execute: async ({ content }) => {
      return ctx.services.memory.saveMemory(ctx, agentId, content);
    },
  });
}

export function recallMemoryTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Search long-term memory for information relevant to a query. Use this when you need to recall specific details from past conversations or context.",
    inputSchema: z.object({
      query: z.string().describe("What to search for in memory"),
    }),
    execute: async ({ query }) => {
      const { recent, relevant } = await ctx.services.memory.recallMemories(
        ctx,
        agentId,
        query,
      );
      const all = [...recent, ...relevant];
      if (all.length === 0) return { found: false, memories: [] };
      return {
        found: true,
        memories: all.map((m) => ({ date: m.date, content: m.content })),
      };
    },
  });
}

export const defaultTools = { webSearch, sendEmail, checkInbox };
