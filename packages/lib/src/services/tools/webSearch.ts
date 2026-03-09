import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

async function searchBrave(query: string, apiKey: string): Promise<unknown> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);

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

  return res.json();
}

async function searchTavily(query: string, apiKey: string): Promise<unknown> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      include_answer: true,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily API error: ${res.status}`);
  }

  return res.json();
}

const WEB_SEARCH_PROVIDERS = ["brave", "tavily"];

async function resolveProvider(
  ctx: ServiceContext,
  preferred: string,
): Promise<{ provider: string; apiKey: string } | null> {
  const key = await ctx.services.integrations.getProviderApiKey(
    ctx.resources,
    preferred,
  );
  if (key) return { provider: preferred, apiKey: key };

  for (const id of WEB_SEARCH_PROVIDERS) {
    if (id === preferred) continue;
    const fallback = await ctx.services.integrations.getProviderApiKey(
      ctx.resources,
      id,
    );
    if (fallback) return { provider: id, apiKey: fallback };
  }

  return null;
}

export function createWebSearchTool(ctx: ServiceContext, provider: string) {
  return tool({
    description:
      "Search the web for information. Returns the full API response from the configured search provider (Brave Search or Tavily).",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
      const resolved = await resolveProvider(ctx, provider);
      if (!resolved) {
        return {
          error:
            "Web search failed: no search provider API key is configured. The user must connect a Brave Search or Tavily API key in Integrations before web search can be used. Do not retry — inform the user that this integration needs to be configured.",
        };
      }

      const { provider: activeProvider, apiKey } = resolved;
      const response =
        activeProvider === "tavily"
          ? await searchTavily(query, apiKey)
          : await searchBrave(query, apiKey);

      return { provider: activeProvider, response };
    },
  });
}

// Default export for backward compatibility (stub when no context available)
export const webSearch = tool({
  description:
    "Search the web for information. Returns the full API response from the configured search provider.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    return {
      error: `[no provider configured] Cannot search for: "${query}"`,
    };
  },
});
