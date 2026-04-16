import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "./toolResult.js";

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
    execute: wrapExecute(
      "tavilySearch",
      async ({
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
          return toolErr(
            ToolErrorCode.ConfigMissing,
            "Tavily is not configured.",
            "Ask the user to add a Tavily API key in Integrations. Do not retry this tool until they confirm it is configured; use a different search tool if one is available.",
          );
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
          return toolErr(
            ToolErrorCode.UpstreamError,
            `Tavily API error: ${res.status}`,
            res.status >= 500
              ? "Tavily is having trouble. Retry once; if it keeps failing, try a different search tool or a simpler query."
              : res.status === 429
                ? "Tavily rate-limited the request. Wait before retrying, or use a different search tool."
                : "Tavily rejected the request. Try a simpler or more specific query, or check that the API key is valid.",
          );
        }

        return toolOk(await res.json());
      },
    ),
  });
}
