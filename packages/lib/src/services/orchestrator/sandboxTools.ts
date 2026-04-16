import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../logger.js";
import type { ServiceContext } from "../context.js";
import { limitLines } from "../sandbox/shared.js";
import type {
  CommandResult,
  ReadOutputResult,
  SandboxSession,
} from "../sandbox/types.js";
import { createAllowlistStore } from "../shellGuard/allowlistStore.js";

const log = createLogger("sandbox:tools");

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function formatOutput(
  stdout: string,
  stderr: string,
  exitCode: number,
): string {
  if (!stderr) return stdout;
  // On failure, show stderr first so the agent sees the error immediately
  if (exitCode !== 0) {
    return `[stderr]\n${stderr}\n\n[stdout]\n${stdout}`;
  }
  return `${stdout}\n\n[stderr]\n${stderr}`;
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

const BOOT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_FAST_MS = 1_000; // 1s for first 15s (catches hibernate resumes)
const POLL_SLOW_MS = 3_000; // 3s after that (cold boot)
const POLL_FAST_WINDOW_MS = 15_000;

/**
 * Ensure a connected sandbox session exists for the agent.
 * Blocks until the sandbox is healthy and connected, or throws on timeout.
 */
async function ensureSandbox(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
): Promise<SandboxSession> {
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

  // Cold start — launch EC2 (or start stopped instance) then poll until ready
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

  log.info({ agentId, instanceId }, "Waiting for sandbox to become healthy");

  // Poll until the sandbox is healthy and we can connect.
  // Uses fast polling initially (catches hibernate resumes quickly),
  // then backs off for cold boots to reduce API calls.
  const startedAt = Date.now();
  const deadline = startedAt + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const elapsed = Date.now() - startedAt;
    const interval =
      elapsed < POLL_FAST_WINDOW_MS ? POLL_FAST_MS : POLL_SLOW_MS;
    await new Promise((r) => setTimeout(r, interval));

    const session = await ctx.services.sandbox.tryQuickConnect(
      agentId,
      instanceId,
    );
    if (session) {
      await ctx.services.sandbox.connectToSandbox(session);
      session.lastActivityAt = Date.now();
      activeSessions.set(taskId, session);
      log.info(
        { agentId, taskId, instanceId },
        "Sandbox connected after cold boot",
      );
      return session;
    }
  }

  throw new Error(
    `Sandbox failed to become healthy within ${BOOT_TIMEOUT_MS / 1000}s`,
  );
}

export function ensureSandboxTool(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
) {
  return tool({
    description:
      "Ensure the sandbox is online and ready for commands. Call this FIRST — before readSkill, authenticate, or runCommand. If the sandbox is already running, returns immediately. If it needs to boot, this call blocks until it's ready (may take a few minutes).",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        await ensureSandbox(ctx, agentId, taskId);
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

      return { status: "ready" };
    },
  });
}

export function runCommandTool(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
  skillEnvProvider?: () => Record<string, string>,
  shellGuardEnabled?: boolean,
) {
  return tool({
    description:
      "Execute a shell command in the sandbox. Returns stdout, stderr, and exit code. The sandbox must be online first — call ensureSandbox before your first command. Commands run non-interactively (no TTY). Working directory is /workspace (persistent across sessions). Commands may take up to 20 minutes.\n\nPre-installed: bash, git, python3, pip, jq, curl, wget, Go, Rust, build-essential, pkg-config, libssl-dev.\nInstall packages: `npm install -g`, `pip install --user`, `go install`, `cargo install` work without sudo. For system packages use `sudo apt-get install`.",
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
      maxLines: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          "Only return the first N lines of stdout. Useful for commands that produce long output when you only need the beginning (e.g. ls, find, grep).",
        ),
      tail: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          "Only return the last N lines of stdout. Useful for log files or build output where the end matters most.",
        ),
    }),
    execute: async ({ command, maxLines, tail }) => {
      // Check for an active session — don't implicitly boot
      const session = activeSessions.get(taskId);
      if (!session?.ws || session.ws.readyState !== session.ws.OPEN) {
        throw new Error(
          "Sandbox is not online. Call ensureSandbox first to boot it up.",
        );
      }

      // Shell guard: evaluate command against allowlist and safe bins
      if (shellGuardEnabled) {
        const allowlistProvider = createAllowlistStore(ctx);
        const verdict = await ctx.services.shellGuard.guardCommand({
          command,
          agentId,
          taskId,
          allowlistProvider,
        });

        if (verdict.status === "invalid") {
          return {
            output: verdict.error,
            exitCode: 1,
          };
        }

        if (verdict.status === "approval_required") {
          // Create a CommandApproval entity — the turn will end and
          // the frontend will render approval buttons on this tool call.
          const approval = await ctx.services.shellGuard.createCommandApproval(
            ctx,
            {
              agentId,
              taskId,
              command,
              reason: verdict.reason,
            },
          );

          log.info(
            {
              agentId,
              taskId,
              commandApprovalId: approval.id,
              reason: verdict.reason,
            },
            "Command requires approval — pausing turn",
          );

          return {
            status: "pending_approval",
            commandApprovalId: approval.id,
            reason: verdict.reason,
          };
        }
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
          outputLength: result.output.length,
          durationMs: result.durationMs,
        },
        "Command result returned to agent",
      );

      // Apply line limiting if requested
      let stdout = result.output;
      let linesLimited = false;
      if (maxLines || tail) {
        const limited = limitLines(stdout, { maxLines, tail });
        stdout = limited.text;
        linesLimited = limited.limited;
      }

      const output = formatOutput(stdout, result.stderr, result.exitCode);

      return {
        output,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        ...(linesLimited ? { linesLimited: true } : {}),
        ...(result.outputTruncated
          ? {
              outputTruncated: true,
              totalOutputBytes: result.totalOutputBytes,
              hint: `Output was truncated. Use readCommandOutput with commandId "${result.commandId}" to page through the full output.`,
            }
          : {}),
      };
    },
  });
}

export function readCommandOutputTool(
  ctx: ServiceContext,
  agentId: string,
  taskId: string,
) {
  return tool({
    description:
      "Read a portion of a previous command's full output. Use this when runCommand indicates output was truncated and you need to see more. Supports reading specific byte ranges from stdout or stderr.",
    inputSchema: z.object({
      commandId: z
        .string()
        .describe("The commandId returned by the truncated runCommand call"),
      stream: z
        .enum(["stdout", "stderr"])
        .optional()
        .describe("Which stream to read (default: stdout)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Byte offset to start reading from (default: 0)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(65536)
        .optional()
        .describe("Maximum bytes to read (default: 8192, max: 65536)"),
    }),
    execute: async ({ commandId, stream, offset, limit }) => {
      const resolvedStream = stream ?? "stdout";
      const resolvedOffset = offset ?? 0;
      const resolvedLimit = limit ?? 8192;
      const session = activeSessions.get(taskId);
      if (!session?.ws || session.ws.readyState !== session.ws.OPEN) {
        return {
          status: "error",
          error:
            "Sandbox is not online. Call ensureSandbox first to boot it up.",
        };
      }

      session.lastActivityAt = Date.now();

      let result: ReadOutputResult;
      try {
        result = await ctx.services.sandbox.readOutput(session, commandId, {
          stream: resolvedStream,
          offset: resolvedOffset,
          limit: resolvedLimit,
        });
      } catch (err) {
        log.error(
          { agentId, taskId, commandId, error: (err as Error).message },
          "readOutput failed",
        );
        return {
          status: "error",
          error: (err as Error).message,
        };
      }

      return {
        data: result.data,
        stream: result.stream,
        offset: result.offset,
        bytesRead: result.bytesRead,
        totalBytes: result.totalBytes,
      };
    },
  });
}
