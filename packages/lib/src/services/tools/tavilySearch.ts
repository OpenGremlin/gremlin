import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function createTavilySearchTool(ctx: ServiceContext) {
  return tool({
    description:
      "Search the web using Tavily, an AI-optimized search engine. Can return a direct answer, full page content, and relevance-scored results.",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
      search_depth: z
        .enum(["basic", "advanced"])
        .optional()
        .describe(
          "Search depth: basic is faster, advanced is more thorough (default basic)",
        ),
      topic: z
        .enum(["general", "news"])
        .optional()
        .describe("Search topic category (default general)"),
      max_results: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Maximum number of results (default 5, max 20)"),
      include_answer: z
        .boolean()
        .optional()
        .describe(
          "Include a short AI-generated answer summarizing the results (default true)",
        ),
      include_raw_content: z
        .boolean()
        .optional()
        .describe(
          "Include the full cleaned HTML content of each result page (default false)",
        ),
      days: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("Only return results from the past N days"),
    }),
    execute: async ({
      query,
      search_depth,
      topic,
      max_results,
      include_answer,
      include_raw_content,
      days,
    }) => {
      const apiKey = await ctx.services.integrations.getProviderApiKey(
        ctx.resources,
        "tavily",
      );
      if (!apiKey) {
        return {
          error:
            "Tavily is not configured. The user must add a Tavily API key in Integrations. Do not retry.",
        };
      }

      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: search_depth ?? "basic",
          topic: topic ?? "general",
          max_results: max_results ?? 5,
          include_answer: include_answer ?? true,
          include_raw_content: include_raw_content ?? false,
          ...(days ? { days } : {}),
        }),
      });

      if (!res.ok) {
        return { error: `Tavily API error: ${res.status}` };
      }

      return res.json();
    },
  });
}
