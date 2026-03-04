import { tool } from "ai";
import { z } from "zod";
import type { SandboxSession } from "../sandbox/types.js";
import {
  browserClick,
  browserEvaluate,
  browserGetContent,
  browserNavigate,
  browserScreenshot,
  browserType,
} from "../sandbox/browserCommands.js";
import { activeSessions } from "./sandboxTools.js";

function getSession(agentId: string): SandboxSession {
  const session = activeSessions.get(agentId);
  if (!session) {
    throw new Error("No sandbox running. Call launchSandbox first.");
  }
  return session;
}

export function browserNavigateTool(_agentId: string) {
  return tool({
    description:
      "Navigate the sandbox browser to a URL. The browser runs inside the sandbox sidecar with a full headless Chromium instance.",
    inputSchema: z.object({
      url: z.string().describe("The URL to navigate to"),
    }),
    execute: async ({ url }) => {
      try {
        const session = getSession(_agentId);
        return await browserNavigate(session, url);
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserScreenshotTool(_agentId: string) {
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
        const session = getSession(_agentId);
        return await browserScreenshot(session, { fullPage });
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserClickTool(_agentId: string) {
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
        const session = getSession(_agentId);
        return await browserClick(session, { selector, x, y });
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserTypeTool(_agentId: string) {
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
        const session = getSession(_agentId);
        return await browserType(session, { text, selector });
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserEvaluateTool(_agentId: string) {
  return tool({
    description:
      "Execute JavaScript in the browser page context. Returns the result of the expression.",
    inputSchema: z.object({
      expression: z.string().describe("JavaScript expression to evaluate"),
    }),
    execute: async ({ expression }) => {
      try {
        const session = getSession(_agentId);
        return await browserEvaluate(session, expression);
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

export function browserGetContentTool(_agentId: string) {
  return tool({
    description:
      "Get the text content of the current browser page (document.body.innerText).",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const session = getSession(_agentId);
        return await browserGetContent(session);
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}
