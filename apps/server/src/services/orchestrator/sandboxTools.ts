import { EC2Client, TerminateInstancesCommand } from "@aws-sdk/client-ec2";
import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import type { CommandResult, SandboxSession } from "../sandbox/types.js";

const ec2 = new EC2Client({});

const log = createLogger("sandbox:tools");

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function formatOutput(stdout: string, stderr: string): string {
  return stderr ? `${stdout}\n\n[stderr]\n${stderr}` : stdout;
}

// In-memory map of active sandbox sessions (exported for browser tools)
export const activeSessions = new Map<string, SandboxSession>();

// Periodically stop sandboxes that have been idle for too long
setInterval(async () => {
  const now = Date.now();
  for (const [agentId, session] of activeSessions) {
    if (now - session.lastActivityAt > IDLE_TIMEOUT_MS) {
      log.info(
        {
          agentId,
          instanceId: session.instanceId,
          idleMs: now - session.lastActivityAt,
        },
        "Auto-stopping idle sandbox",
      );
      try {
        const { terminateSandbox } = await import(
          "../sandbox/terminateSandbox.js"
        );
        await terminateSandbox(session);
        activeSessions.delete(agentId);
      } catch (err) {
        log.error(
          { agentId, error: (err as Error).message },
          "Failed to auto-stop idle sandbox",
        );
      }
    }
  }
}, 60_000);

export function launchSandboxTool(
  ctx: ServiceContext,
  agentId: string,
  taskId?: string,
) {
  return tool({
    description:
      "Launch a sandbox environment with a bash shell. The sandbox persists a /workspace directory across sessions. Call this before running any commands. If the sandbox needs to boot, you'll be notified when it's ready — stop and wait.",
    inputSchema: z.object({}),
    execute: async () => {
      // Check if already running
      const existing = activeSessions.get(agentId);
      if (existing?.ws && existing.ws.readyState === existing.ws.OPEN) {
        log.info({ agentId }, "Sandbox already running, reusing session");
        return { status: "ready" };
      }

      // Read agent record to get existing instanceId
      const agent = await ctx.services.agents.getAgent(ctx, agentId);
      const existingInstanceId = agent?.sandboxInstanceId;

      log.info(
        { agentId, existingInstanceId },
        "Agent requested sandbox launch",
      );

      try {
        // Try quick connect to an already-running instance
        if (existingInstanceId) {
          const session = await ctx.services.sandbox.tryQuickConnect(
            agentId,
            existingInstanceId,
          );
          if (session) {
            await ctx.services.sandbox.connectToSandbox(session);
            session.lastActivityAt = Date.now();
            activeSessions.set(agentId, session);
            log.info(
              { agentId, instanceId: session.instanceId },
              "Quick-connected to existing sandbox",
            );
            return { status: "ready" };
          }
        }

        // Cold start — launch EC2 and return immediately
        // The sandbox will notify via /notifyHook when ready
        const instanceId = await ctx.services.sandbox.launchInstance(agentId);

        // Persist instanceId and terminate old instance
        if (instanceId !== existingInstanceId) {
          await ctx.services.agents.updateAgent(ctx, agentId, {
            sandboxInstanceId: instanceId,
          });
          if (existingInstanceId) {
            log.info(
              {
                agentId,
                oldInstanceId: existingInstanceId,
                newInstanceId: instanceId,
              },
              "Terminating old sandbox instance",
            );
            ec2
              .send(
                new TerminateInstancesCommand({
                  InstanceIds: [existingInstanceId],
                }),
              )
              .catch((err) =>
                log.warn(
                  {
                    agentId,
                    instanceId: existingInstanceId,
                    error: (err as Error).message,
                  },
                  "Failed to terminate old sandbox instance",
                ),
              );
          }
        }

        // Subscribe so this task gets woken up when the sandbox is ready
        if (taskId) {
          await ctx.services.sandbox.subscribe(
            ctx,
            agentId,
            taskId,
            "sandbox_available",
          );
        }

        log.info(
          { agentId, instanceId },
          "Sandbox instance launching, agent will be notified when ready",
        );
        return {
          status: "launching",
          message:
            "Sandbox is booting up. You'll be notified when it's ready. Stop and wait.",
        };
      } catch (err) {
        log.error(
          {
            agentId,
            error: (err as Error).message,
            stack: (err as Error).stack,
          },
          "launchSandbox failed",
        );
        return {
          status: "error",
          error: (err as Error).message,
        };
      }
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

      session.lastActivityAt = Date.now();
      log.info(
        { agentId, commandPreview: command.slice(0, 200) },
        "Agent running command",
      );

      let result: CommandResult;
      try {
        result = await ctx.services.sandbox.execCommand(session, command, {
          pubsub: ctx.resources.pubsub,
          taskId,
        });
      } catch (err) {
        log.error(
          { agentId, error: (err as Error).message },
          "execCommand failed",
        );
        activeSessions.delete(agentId);
        return {
          error: "Sandbox connection lost. Call launchSandbox to reconnect.",
          output: "",
          exitCode: -1,
        };
      }

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
