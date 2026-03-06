import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import type { SandboxSession } from "../sandbox/types.js";

const log = createLogger("sandbox:tools");

// In-memory map of active sandbox sessions (exported for browser tools)
export const activeSessions = new Map<string, SandboxSession>();

export function launchSandboxTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Launch a sandbox environment with a bash shell and headless Chromium browser. The sandbox persists a /workspace directory across sessions. Call this before running any commands.",
    inputSchema: z.object({}),
    execute: async () => {
      // Check if already running
      const existing = activeSessions.get(agentId);
      if (existing?.ws && existing.ws.readyState === existing.ws.OPEN) {
        log.info({ agentId }, "Sandbox already running, reusing session");
        return { status: "already_running", wsUrl: existing.wsUrl };
      }

      log.info({ agentId }, "Agent requested sandbox launch");
      const session = await ctx.services.sandbox.launchSandbox(agentId);
      await ctx.services.sandbox.connectToSandbox(session);
      activeSessions.set(agentId, session);

      log.info({ agentId, taskArn: session.taskArn, wsUrl: session.wsUrl }, "Sandbox session active");
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
        log.warn({ agentId }, "runCommand called with no active sandbox");
        return {
          error: "No sandbox running. Call launchSandbox first.",
          output: "",
          exitCode: -1,
        };
      }

      log.info({ agentId, commandPreview: command.slice(0, 200) }, "Agent running command");
      const result = await ctx.services.sandbox.execCommand(session, command);
      log.info(
        { agentId, exitCode: result.exitCode, timedOut: result.timedOut, outputLength: result.output.length },
        "Command result returned to agent",
      );
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
        log.warn({ agentId }, "terminateSandbox called with no active sandbox");
        return { status: "no_sandbox_running" };
      }

      log.info({ agentId, taskArn: session.taskArn }, "Agent requested sandbox termination");
      await ctx.services.sandbox.terminateSandbox(session);
      activeSessions.delete(agentId);

      log.info({ agentId }, "Sandbox session cleaned up");
      return { status: "terminated" };
    },
  });
}
