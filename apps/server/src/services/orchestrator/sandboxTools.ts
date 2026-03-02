import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import type { SandboxSession } from "../sandbox/types.js";

// In-memory map of active sandbox sessions
const activeSessions = new Map<string, SandboxSession>();

export function launchSandboxTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Launch a sandbox environment with a bash shell and headless Chromium browser. The sandbox persists a /workspace directory across sessions. Call this before running any commands.",
    inputSchema: z.object({}),
    execute: async () => {
      // Check if already running
      const existing = activeSessions.get(agentId);
      if (existing?.ws && existing.ws.readyState === existing.ws.OPEN) {
        return { status: "already_running", wsUrl: existing.wsUrl };
      }

      const session = await ctx.services.sandbox.launchSandbox(agentId);
      await ctx.services.sandbox.connectToSandbox(session);
      activeSessions.set(agentId, session);

      return { status: "ready", wsUrl: session.wsUrl };
    },
  });
}

export function runCommandTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Execute a shell command in the sandbox. Returns the command output and exit code. The sandbox has bash, git, python3, jq, curl, and a headless Chromium browser (via Playwright) available. Working directory is /workspace (persistent across sessions). Max 120s per command, output truncated to 8K chars.",
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
    execute: async ({ command }) => {
      const session = activeSessions.get(agentId);
      if (!session) {
        return {
          error: "No sandbox running. Call launchSandbox first.",
          output: "",
          exitCode: -1,
        };
      }

      const result = await ctx.services.sandbox.execCommand(session, command);
      return result;
    },
  });
}

export function terminateSandboxTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Shut down the sandbox environment. The /workspace volume is preserved for next time. Call this when you're done with the sandbox.",
    inputSchema: z.object({}),
    execute: async () => {
      const session = activeSessions.get(agentId);
      if (!session) {
        return { status: "no_sandbox_running" };
      }

      await ctx.services.sandbox.terminateSandbox(session);
      activeSessions.delete(agentId);

      return { status: "terminated" };
    },
  });
}
