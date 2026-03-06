import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import type { SandboxSession } from "../sandbox/types.js";
import { cleanupBrowserSession } from "./browserTools.js";

const log = createLogger("sandbox:tools");

function formatOutput(stdout: string, stderr: string): string {
  return stderr ? `${stdout}\n\n[stderr]\n${stderr}` : stdout;
}

// In-memory map of active sandbox sessions (exported for browser tools)
export const activeSessions = new Map<string, SandboxSession>();

export function launchSandboxTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Launch a sandbox environment with a bash shell. The sandbox persists a /workspace directory across sessions. Call this before running any commands.",
    inputSchema: z.object({}),
    execute: async () => {
      // Check if already running
      const existing = activeSessions.get(agentId);
      if (existing?.ws && existing.ws.readyState === existing.ws.OPEN) {
        log.info({ agentId }, "Sandbox already running, reusing session");
        return { status: "already_running", wsUrl: existing.wsUrl };
      }

      // Read agent record to get existing instanceId
      const agent = await ctx.services.agents.getAgent(ctx, agentId);
      const existingInstanceId = agent?.sandboxInstanceId;

      log.info(
        { agentId, existingInstanceId },
        "Agent requested sandbox launch",
      );
      const session = await ctx.services.sandbox.launchSandbox(
        agentId,
        existingInstanceId,
      );
      await ctx.services.sandbox.connectToSandbox(session);
      activeSessions.set(agentId, session);

      // Persist instanceId if it's new or changed
      if (
        session.instanceId !== "local" &&
        session.instanceId !== existingInstanceId
      ) {
        log.info(
          { agentId, instanceId: session.instanceId },
          "Persisting new instanceId",
        );
        await ctx.services.agents.updateAgent(ctx, agentId, {
          sandboxInstanceId: session.instanceId,
        });
      }

      log.info(
        { agentId, instanceId: session.instanceId, wsUrl: session.wsUrl },
        "Sandbox session active",
      );
      return { status: "ready", wsUrl: session.wsUrl };
    },
  });
}

export function runCommandTool(
  ctx: ServiceContext,
  agentId: string,
  taskId?: string,
) {
  return tool({
    description:
      "Execute a shell command in the sandbox. Returns stdout, stderr, and exit code. Commands run non-interactively (no TTY). The sandbox has bash, git, python3, jq, curl, and build tools available. Working directory is /workspace (persistent across sessions). Commands that take longer than 30s are auto-backgrounded — use checkCommand with the returned commandId to poll for results.",
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

      log.info(
        { agentId, commandPreview: command.slice(0, 200) },
        "Agent running command",
      );
      const result = await ctx.services.sandbox.execCommand(session, command, {
        pubsub: ctx.resources.pubsub,
        taskId,
      });
      log.info(
        {
          agentId,
          exitCode: result.exitCode,
          timedOut: result.timedOut,
          backgrounded: result.backgrounded,
          outputLength: result.output.length,
          durationMs: result.durationMs,
        },
        "Command result returned to agent",
      );

      if (result.backgrounded) {
        return {
          status: "backgrounded",
          commandId: result.commandId,
          output: result.output,
          note: "Command still running. Use checkCommand(commandId) to poll for results.",
        };
      }

      const output = formatOutput(result.output, result.stderr);

      return {
        output,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        commandId: result.commandId,
      };
    },
  });
}

export function checkCommandTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Check the status of a backgrounded command. Returns current output and whether the command has finished. Call this after runCommand returns a backgrounded status.",
    inputSchema: z.object({
      commandId: z
        .string()
        .describe(
          "The command ID returned by runCommand when it was backgrounded",
        ),
    }),
    execute: async ({ commandId }) => {
      log.info({ agentId, commandId }, "Agent checking backgrounded command");
      const result = ctx.services.sandbox.checkCommand(commandId);
      log.info(
        {
          agentId,
          commandId,
          finished: result.finished,
          exitCode: result.exitCode,
          outputLength: result.output.length,
        },
        "checkCommand result",
      );

      if (result.finished) {
        const output = result.stderr
          ? `${result.output}\n\n[stderr]\n${result.stderr}`
          : result.output;
        return { output, exitCode: result.exitCode, finished: true };
      }

      return {
        output: result.output,
        finished: false,
        note: "Command still running. Call checkCommand again to poll.",
      };
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

      log.info(
        { agentId, instanceId: session.instanceId },
        "Agent requested sandbox termination",
      );
      cleanupBrowserSession(ctx, agentId);
      await ctx.services.sandbox.terminateSandbox(session);
      activeSessions.delete(agentId);

      log.info({ agentId }, "Sandbox session cleaned up");
      return { status: "terminated" };
    },
  });
}
