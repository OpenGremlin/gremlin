import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchBrave(
  query: string,
  apiKey: string,
): Promise<SearchResult[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "5");

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Brave Search API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.web?.results ?? []).map(
    (r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
    }),
  );
}

async function searchTavily(
  query: string,
  apiKey: string,
): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
      include_answer: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.results ?? []).map(
    (r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }),
  );
}

export function createWebSearchTool(ctx: ServiceContext, provider: string) {
  return tool({
    description:
      "Search the web for information. Returns a summary of relevant results.",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
      const apiKey = await ctx.services.integrations.getProviderApiKey(
        ctx.resources,
        provider,
      );
      if (!apiKey) {
        return {
          results: `Web search not available — no ${provider} API key configured.`,
        };
      }

      const results =
        provider === "tavily"
          ? await searchTavily(query, apiKey)
          : await searchBrave(query, apiKey);

      if (results.length === 0) {
        return { results: `No results found for: "${query}"` };
      }

      const formatted = results
        .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
        .join("\n\n");

      return { results: formatted };
    },
  });
}

// Default export for backward compatibility (stub when no context available)
export const webSearch = tool({
  description:
    "Search the web for information. Returns a summary of relevant results.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    return {
      results: `[no provider configured] Search results for: "${query}"`,
    };
  },
});
