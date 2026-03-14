import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import type { CommandResult, SandboxSession } from "../sandbox/types.js";

const log = createLogger("sandbox:tools");

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function formatOutput(stdout: string, stderr: string): string {
  return stderr ? `${stdout}\n\n[stderr]\n${stderr}` : stdout;
}

// In-memory map of active sandbox sessions keyed by taskId (exported for browser tools)
export const activeSessions = new Map<string, SandboxSession>();

// Periodically close sessions that have been idle for too long.
// If no sessions remain for a given sandbox instance, terminate it.
setInterval(async () => {
  const now = Date.now();
  const idleTasks: string[] = [];

  for (const [taskId, session] of activeSessions) {
    if (now - session.lastActivityAt > IDLE_TIMEOUT_MS) {
      idleTasks.push(taskId);
    }
  }

  for (const taskId of idleTasks) {
    const session = activeSessions.get(taskId);
    if (!session) continue;

    const { agentId, instanceId } = session;
    log.info(
      { taskId, agentId, instanceId, idleMs: now - session.lastActivityAt },
      "Closing idle sandbox session",
    );

    // Close the WebSocket and remove from map
    session.ws?.close();
    activeSessions.delete(taskId);

    // If no other sessions use this instance, terminate it
    const stillInUse = [...activeSessions.values()].some(
      (s) => s.instanceId === instanceId,
    );
    if (!stillInUse) {
      try {
        const { terminateSandbox } = await import(
          "../sandbox/terminateSandbox.js"
        );
        await terminateSandbox(session);
        log.info(
          { agentId, instanceId },
          "Terminated sandbox — no remaining sessions",
        );
      } catch (err) {
        log.error(
          { agentId, instanceId, error: (err as Error).message },
          "Failed to terminate idle sandbox",
        );
      }
    }
  }
}, 60_000);

/**
 * Try to ensure a connected sandbox session exists for the agent.
 * Returns the session if connected, or null if a cold boot was initiated
 * (the agent will be woken up via /notifyHook when the sandbox is ready).
 */
async function ensureSandbox(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
): Promise<SandboxSession | null> {
  // Already connected for this task
  const existing = activeSessions.get(taskId);
  if (existing?.ws && existing.ws.readyState === existing.ws.OPEN) {
    return existing;
  }

  // Read agent record to get existing instanceId
  const agent = await ctx.services.agents.getAgent(ctx, agentId);
  const existingInstanceId = agent?.sandboxInstanceId;

  log.info({ agentId, existingInstanceId }, "Ensuring sandbox is available");

  // Try quick connect to an already-running instance (or local sandbox)
  if (existingInstanceId || process.env.SANDBOX_LOCAL === "true") {
    const session = await ctx.services.sandbox.tryQuickConnect(
      agentId,
      existingInstanceId ?? "local",
    );
    if (session) {
      await ctx.services.sandbox.connectToSandbox(session);
      session.lastActivityAt = Date.now();
      activeSessions.set(taskId, session);
      log.info(
        { agentId, taskId, instanceId: session.instanceId },
        "Quick-connected to existing sandbox",
      );
      return session;
    }
  }

  // Subscribe BEFORE launching so the notification can't arrive before
  // the subscription exists (eliminates race condition)
  await ctx.services.sandbox.subscribe(
    ctx,
    agentId,
    taskId,
    "sandbox_available",
  );

  // Cold start — launch EC2 (or start stopped instance) and return immediately
  // The sandbox will notify via /notifyHook when ready
  const instanceId = await ctx.services.sandbox.launchInstance(
    agentId,
    existingInstanceId,
  );

  // Persist instanceId if it changed
  if (instanceId !== existingInstanceId) {
    await ctx.services.agents.updateAgent(ctx, agentId, {
      sandboxInstanceId: instanceId,
    });
  }

  log.info(
    { agentId, instanceId },
    "Sandbox instance launching, agent will be notified when ready",
  );
  return null;
}

export function ensureSandboxTool(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
) {
  return tool({
    description:
      "Ensure the sandbox is online and ready for commands. Call this before running commands. If the sandbox is already running, returns immediately. If it needs to boot, you'll be notified when it's ready — stop and wait.",
    inputSchema: z.object({}),
    execute: async () => {
      let session: SandboxSession | null;
      try {
        session = await ensureSandbox(ctx, agentId, taskId);
      } catch (err) {
        log.error(
          {
            agentId,
            error: (err as Error).message,
            stack: (err as Error).stack,
          },
          "ensureSandbox failed",
        );
        return { status: "error", error: (err as Error).message };
      }

      if (!session) {
        return {
          status: "booting",
          message:
            "Sandbox is booting up. You'll be notified when it's ready — stop and wait.",
        };
      }

      return { status: "ready" };
    },
  });
}

export function runCommandTool(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
  skillEnvProvider?: () => Record<string, string>,
) {
  return tool({
    description:
      "Execute a shell command in the sandbox. Returns stdout, stderr, and exit code. The sandbox must be online first — call ensureSandbox before your first command. Commands run non-interactively (no TTY). Working directory is /workspace (persistent across sessions). Commands that take longer than 30s are auto-backgrounded — use checkCommand with the returned commandId to poll for results.\n\nPre-installed: bash, git, python3, pip, jq, curl, wget, Go, Rust, build-essential, pkg-config, libssl-dev.\nInstall packages: `npm install -g`, `pip install --user`, `go install`, `cargo install` work without sudo. For system packages use `sudo apt-get install`.",
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
    execute: async ({ command }) => {
      // Check for an active session — don't implicitly boot
      const session = activeSessions.get(taskId);
      if (!session?.ws || session.ws.readyState !== session.ws.OPEN) {
        return {
          status: "error",
          error:
            "Sandbox is not online. Call ensureSandbox first to boot it up.",
        };
      }

      session.lastActivityAt = Date.now();
      const skillEnv = skillEnvProvider?.();
      log.info(
        {
          agentId,
          taskId,
          commandPreview: command.slice(0, 200),
          skillEnvKeys: skillEnv ? Object.keys(skillEnv) : [],
        },
        "Agent running command",
      );

      let result: CommandResult;
      try {
        result = await ctx.services.sandbox.execCommand(session, command, {
          pubsub: ctx.resources.pubsub,
          taskId,
          env: skillEnv,
        });
      } catch (err) {
        log.error(
          { agentId, taskId, error: (err as Error).message },
          "execCommand failed",
        );
        activeSessions.delete(taskId);
        return {
          error:
            "Sandbox connection lost. Call ensureSandbox to reconnect, then retry.",
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
