import { Readability } from "@mozilla/readability";
import { tool } from "ai";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { z } from "zod";
import { createLogger } from "../../logger.js";

const log = createLogger("tool:webFetch");
const MAX_CHARS = 30_000;
const TIMEOUT_MS = 15_000;

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

function extractContent(html: string): string {
  const { document } = parseHTML(html);

  const reader = new Readability(document, { charThreshold: 0 });
  const article = reader.parse();

  if (article?.content) {
    const md = turndown.turndown(article.content);
    const header = article.title ? `# ${article.title}\n\n` : "";
    return header + md;
  }

  // Fallback: convert full body
  const body = document.querySelector("body");
  if (body) {
    return turndown.turndown(body.innerHTML);
  }

  return document.documentElement?.textContent ?? "";
}

export const webFetch = tool({
  description:
    "Fetch a URL and extract its content as readable markdown. Works best with articles, documentation, and text-heavy pages. Does not execute JavaScript.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to fetch"),
  }),
  execute: async ({ url }) => {
    log.info({ url }, "Fetching URL");

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent": "Gremlin/1.0 (web fetch tool)",
          Accept: "text/html, application/json, text/plain, */*",
        },
        redirect: "follow",
      });

      if (!res.ok) {
        return { error: `HTTP ${res.status} ${res.statusText}` };
      }

      const contentType = res.headers.get("content-type") ?? "";

      // JSON: return raw
      if (contentType.includes("application/json")) {
        const text = await res.text();
        const truncated = text.length > MAX_CHARS;
        return {
          content: truncated ? text.slice(0, MAX_CHARS) : text,
          contentType: "application/json",
          ...(truncated && { truncated: true }),
        };
      }

      // Plain text
      if (
        contentType.includes("text/plain") ||
        contentType.includes("text/csv")
      ) {
        const text = await res.text();
        const truncated = text.length > MAX_CHARS;
        return {
          content: truncated ? text.slice(0, MAX_CHARS) : text,
          contentType: contentType.split(";")[0],
          ...(truncated && { truncated: true }),
        };
      }

      // HTML: extract with readability + turndown
      if (contentType.includes("text/html") || contentType.includes("xhtml")) {
        const html = await res.text();
        const content = extractContent(html);
        const truncated = content.length > MAX_CHARS;
        return {
          content: truncated ? content.slice(0, MAX_CHARS) : content,
          contentType: "text/markdown",
          ...(truncated && { truncated: true }),
        };
      }

      // Binary / unsupported
      return {
        error: `Unsupported content type: ${contentType}`,
        hint: "webFetch works with HTML, JSON, and plain text URLs.",
      };
    } catch (err) {
      log.error({ url, error: (err as Error).message }, "Fetch failed");
      return { error: err instanceof Error ? err.message : String(err) };
    }
  },
});
