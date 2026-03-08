import { tool } from "ai";
import { z } from "zod";

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
