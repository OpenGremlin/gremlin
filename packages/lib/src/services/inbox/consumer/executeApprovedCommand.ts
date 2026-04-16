import { CommandApprovalDecision, type ToolName } from "../../../enums.js";
import type { ServiceContext } from "../../context.js";
import { activeSessions } from "../../orchestrator/sandboxTools/index.js";
import { updateAgentLogResult } from "../../orchestrator/writeAgentLog.js";

/**
 * Execute a resolved CommandApproval and update its agent log entry in-place.
 * Called inside the consumer drain loop so the lane stays in `activeLanes`.
 */
export async function executeApprovedCommand(
  ctx: ServiceContext,
  approvalId: string,
): Promise<void> {
  const approval = await ctx.services.shellGuard.getCommandApproval(
    ctx,
    approvalId,
  );
  if (!approval || !approval.logEntryId) return;

  const isAllowed =
    approval.decision === CommandApprovalDecision.AllowOnce ||
    approval.decision === CommandApprovalDecision.AllowAlways;

  let toolResult: unknown;

  if (isAllowed) {
    const session = activeSessions.get(approval.taskId);
    if (session?.ws && session.ws.readyState === session.ws.OPEN) {
      try {
        const result = await ctx.services.sandbox.execCommand(
          session,
          approval.command,
        );
        const output = result.stderr
          ? `${result.output}\n\n[stderr]\n${result.stderr}`
          : result.output;
        toolResult = {
          output,
          exitCode: result.exitCode,
          timedOut: result.timedOut,
        };
      } catch {
        toolResult = {
          output:
            "Sandbox connection lost. Call ensureSandbox to reconnect, then retry.",
          exitCode: -1,
        };
      }
    } else {
      toolResult = {
        output:
          "Sandbox is not online. Call ensureSandbox first to boot it up.",
        exitCode: -1,
      };
    }
  } else {
    toolResult = {
      output: "Command denied by user.",
      exitCode: 1,
    };
  }

  await updateAgentLogResult(ctx, approval.logEntryId, approval.createdAt, {
    agentId: approval.agentId,
    taskId: approval.taskId,
    toolName: "runCommand" as ToolName,
    toolInput: { command: approval.command },
    toolResult,
    commandApprovalId: approvalId,
  });
}
