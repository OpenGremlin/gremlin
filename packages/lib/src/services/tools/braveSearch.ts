import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "./toolResult.js";

export function createBraveSearchTool(ctx: ServiceContext) {
  return tool({
    description:
      "Search the web using Brave Search. Returns web results, news, FAQ, and infobox data when available.",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
      count: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Number of results to return (default 10, max 20)"),
      freshness: z
        .enum(["pd", "pw", "pm", "py"])
        .optional()
        .describe(
          "Filter by freshness: pd = past day, pw = past week, pm = past month, py = past year",
        ),
    }),
    execute: wrapExecute("braveSearch", async ({ query, count, freshness }) => {
      const apiKey = await ctx.services.integrations.getProviderApiKey(
        ctx.resources,
        "brave",
      );
      if (!apiKey) {
        return toolErr(
          ToolErrorCode.ConfigMissing,
          "Brave Search is not configured.",
          "Ask the user to add a Brave Search API key in Integrations. Do not retry this tool until they confirm it is configured; use a different search tool if one is available.",
        );
      }

      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", query);
      if (count) url.searchParams.set("count", String(count));
      if (freshness) url.searchParams.set("freshness", freshness);

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      });

      if (!res.ok) {
        return toolErr(
          ToolErrorCode.UpstreamError,
          `Brave Search API error: ${res.status}`,
          res.status >= 500
            ? "Brave Search is having trouble. Retry once; if it keeps failing, try a different search tool or a simpler query."
            : res.status === 429
              ? "Brave Search rate-limited the request. Wait before retrying, or use a different search tool."
              : "Brave Search rejected the request. Try a simpler or more specific query, or check that the API key is valid.",
        );
      }

      return toolOk(await res.json());
    }),
  });
}
