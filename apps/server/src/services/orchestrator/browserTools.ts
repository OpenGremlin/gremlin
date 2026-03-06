import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import type { BrowserSession } from "../sandbox/types.js";
import {
  browserClick,
  browserEvaluate,
  browserGetContent,
  browserNavigate,
  browserScreenshot,
  browserType,
} from "../sandbox/browserCommands.js";
import { activeSessions } from "./sandboxTools.js";

const log = createLogger("browser:tools");

// Separate map for browser Fargate sessions
export const activeBrowserSessions = new Map<string, BrowserSession>();

async function getOrLaunchBrowser(
  ctx: ServiceContext,
  agentId: string,
): Promise<BrowserSession> {
  const existing = activeBrowserSessions.get(agentId);
  if (existing) return existing;

  // Ensure sandbox is running (browser tools require a sandbox session)
  if (!activeSessions.has(agentId)) {
    throw new Error("No sandbox running. Call launchSandbox first.");
  }

  log.info({ agentId }, "Lazy-launching browser Fargate task");
  const session = await ctx.services.sandbox.launchBrowser(agentId);
  activeBrowserSessions.set(agentId, session);
  log.info({ agentId, taskArn: session.taskArn }, "Browser session ready");
  return session;
}

export function cleanupBrowserSession(
  ctx: ServiceContext,
  agentId: string,
): void {
  const session = activeBrowserSessions.get(agentId);
  if (session) {
    log.info({ agentId, taskArn: session.taskArn }, "Cleaning up browser session");
    ctx.services.sandbox.terminateBrowser(session).catch((err) => {
      log.error({ agentId, error: (err as Error).message }, "Failed to terminate browser");
    });
    activeBrowserSessions.delete(agentId);
  }
}

export function browserNavigateTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Navigate the browser to a URL. A headless Chromium browser will be launched on-demand the first time you use a browser tool.",
    inputSchema: z.object({
      url: z.string().describe("The URL to navigate to"),
    }),
    execute: async ({ url }) => {
      try {
        const session = await getOrLaunchBrowser(ctx, agentId);
        return await browserNavigate(session, url);
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserScreenshotTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Take a screenshot of the current browser page. Returns a base64-encoded PNG image.",
    inputSchema: z.object({
      fullPage: z
        .boolean()
        .optional()
        .describe("Capture the full scrollable page (default: viewport only)"),
    }),
    execute: async ({ fullPage }) => {
      try {
        const session = await getOrLaunchBrowser(ctx, agentId);
        return await browserScreenshot(session, { fullPage });
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserClickTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Click an element in the browser by CSS selector or x/y coordinates.",
    inputSchema: z.object({
      selector: z
        .string()
        .optional()
        .describe("CSS selector of the element to click"),
      x: z.number().optional().describe("X coordinate to click"),
      y: z.number().optional().describe("Y coordinate to click"),
    }),
    execute: async ({ selector, x, y }) => {
      try {
        const session = await getOrLaunchBrowser(ctx, agentId);
        return await browserClick(session, { selector, x, y });
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserTypeTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Type text into an element in the browser. Optionally focus a specific element by CSS selector first.",
    inputSchema: z.object({
      text: z.string().describe("The text to type"),
      selector: z
        .string()
        .optional()
        .describe("CSS selector of the element to type into"),
    }),
    execute: async ({ text, selector }) => {
      try {
        const session = await getOrLaunchBrowser(ctx, agentId);
        return await browserType(session, { text, selector });
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserEvaluateTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Execute JavaScript in the browser page context. Returns the result of the expression.",
    inputSchema: z.object({
      expression: z.string().describe("JavaScript expression to evaluate"),
    }),
    execute: async ({ expression }) => {
      try {
        const session = await getOrLaunchBrowser(ctx, agentId);
        return await browserEvaluate(session, expression);
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserGetContentTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Get the text content of the current browser page (document.body.innerText).",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const session = await getOrLaunchBrowser(ctx, agentId);
        return await browserGetContent(session);
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}
