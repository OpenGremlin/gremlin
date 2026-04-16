import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../../context.js";
import { limitLines } from "../../../sandbox/shared.js";
import type { CommandResult } from "../../../sandbox/types.js";
import { createAllowlistStore } from "../../../shellGuard/allowlistStore.js";
import {
  ToolErrorCode,
  toolErr,
  toolOk,
  wrapExecute,
} from "../../../tools/toolResult.js";
import { formatOutput } from "../formatOutput.js";
import { activeSessions } from "../sessionRegistry.js";

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
    execute: wrapExecute<
      { command: string; maxLines?: number; tail?: number },
      | {
          status: "pending_approval";
          commandApprovalId: string;
          reason: string;
        }
      | {
          output: string;
          exitCode: number;
          timedOut: boolean;
          linesLimited?: true;
          outputTruncated?: true;
          totalOutputBytes?: number;
          hint?: string;
        }
    >("runCommand", async ({ command, maxLines, tail }) => {
      // Check for an active session — don't implicitly boot
      const session = activeSessions.get(taskId);
      if (!session?.ws || session.ws.readyState !== session.ws.OPEN) {
        return toolErr(
          ToolErrorCode.InvalidInput,
          "Sandbox session not connected",
          "Call `ensureSandbox` first to initialize the sandbox.",
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
          return toolErr(
            ToolErrorCode.InvalidInput,
            verdict.error,
            "The shell guard rejected this command. Rephrase or split it into simpler steps.",
          );
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

          ctx.log.info(
            {
              agentId,
              taskId,
              commandApprovalId: approval.id,
              reason: verdict.reason,
              component: "sandbox:tools",
            },
            "Command requires approval — pausing turn",
          );

          return toolOk({
            status: "pending_approval" as const,
            commandApprovalId: approval.id,
            reason: verdict.reason,
          });
        }
      }

      session.lastActivityAt = Date.now();
      const skillEnv = skillEnvProvider?.();
      ctx.log.info(
        {
          agentId,
          taskId,
          commandPreview: command.slice(0, 200),
          skillEnvKeys: skillEnv ? Object.keys(skillEnv) : [],
          component: "sandbox:tools",
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
        ctx.log.error(
          {
            agentId,
            taskId,
            error: (err as Error).message,
            component: "sandbox:tools",
          },
          "execCommand failed",
        );
        activeSessions.delete(taskId);
        return toolErr(
          ToolErrorCode.InternalError,
          (err as Error).message,
          "Sandbox connection lost. Call `ensureSandbox` to reconnect, then retry the command.",
        );
      }

      ctx.log.info(
        {
          agentId,
          exitCode: result.exitCode,
          timedOut: result.timedOut,
          outputLength: result.output.length,
          durationMs: result.durationMs,
          component: "sandbox:tools",
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

      return toolOk({
        output,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        ...(linesLimited ? { linesLimited: true as const } : {}),
        ...(result.outputTruncated
          ? {
              outputTruncated: true as const,
              totalOutputBytes: result.totalOutputBytes,
              hint: `Output was truncated. Use readCommandOutput with commandId "${result.commandId}" to page through the full output.`,
            }
          : {}),
      });
    }),
  });
}
