import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

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
