import { PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  CommandApprovalDecision,
  CommandApprovalStatus,
  type ToolName,
} from "../../enums.js";
import type { ServiceContext } from "../context.js";
import { activeSessions } from "../orchestrator/sandboxTools.js";
import { updateAgentLogResult } from "../orchestrator/writeAgentLog.js";
import { createAllowlistStore } from "./allowlistStore.js";
import { getCommandApproval } from "./getCommandApproval.js";
import { analyzeCommand } from "./shellParse.js";

/**
 * Resolve a CommandApproval: update status, execute command if allowed,
 * update the agent log entry in-place, and ring the doorbell.
 */
export async function resolveCommandApproval(
  ctx: ServiceContext,
  approvalId: string,
  decision: string,
) {
  // 1. Load and verify PENDING
  const approval = await getCommandApproval(ctx, approvalId);
  if (!approval) {
    throw new Error(`CommandApproval ${approvalId} not found`);
  }
  if (approval.status !== CommandApprovalStatus.Pending) {
    throw new Error(`CommandApproval ${approvalId} is already resolved`);
  }
  if (!approval.logEntryId) {
    throw new Error(`CommandApproval ${approvalId} has no logEntryId`);
  }

  const now = new Date().toISOString();
  const decisionEnum = decision as CommandApprovalDecision;

  // 2. Update status to RESOLVED
  const updated = {
    ...approval,
    status: CommandApprovalStatus.Resolved,
    decision: decisionEnum,
    resolvedAt: now,
  };

  const table = ctx.resources.ddb.table;
  await table.getDocumentClient().send(
    new PutCommand({
      TableName: table.getName(),
      Item: {
        ...updated,
        _et: "CommandApproval",
        pk: "COMMAND_APPROVAL",
        sk: `COMMAND_APPROVAL#${approvalId}`,
      },
    }),
  );

  ctx.log.info(
    { commandApprovalId: approvalId, decision },
    "Resolved command approval",
  );

  // 3. Execute command if allowed, or return denial
  let toolResult: unknown;
  const isAllowed =
    decisionEnum === CommandApprovalDecision.AllowOnce ||
    decisionEnum === CommandApprovalDecision.AllowAlways;

  if (isAllowed) {
    // Persist to allowlist for "allow always" — extract each executable
    if (decisionEnum === CommandApprovalDecision.AllowAlways) {
      const store = createAllowlistStore(ctx);
      const analysis = analyzeCommand(approval.command);
      if (analysis.ok) {
        for (const segment of analysis.segments) {
          if (segment.executable) {
            await store.addEntry(approval.agentId, {
              pattern: segment.executable,
            });
          }
        }
      }
      ctx.log.info(
        { agentId: approval.agentId, command: approval.command.slice(0, 200) },
        "Added command executables to allowlist (allow-always)",
      );
    }

    // Execute via sandbox — look up the in-memory session by taskId
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
      // Sandbox timed out — agent will reconnect and re-run naturally
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

  // 4. Update the agent log entry in-place with actual result
  await updateAgentLogResult(ctx, approval.logEntryId, approval.createdAt, {
    agentId: approval.agentId,
    taskId: approval.taskId,
    toolName: "runCommand" as ToolName,
    toolInput: { command: approval.command },
    toolResult,
    commandApprovalId: approvalId,
  });

  // 5. Resume inference. The log entry was already updated in-place,
  // so the agent's conversation history is correct. Enqueue a resume_task
  // item which triggers runLane without writing a new message to the log.
  // Command approvals only happen on task lanes (sandbox tools require taskId).
  if (!approval.taskId) {
    ctx.log.error(
      { commandApprovalId: approvalId },
      "CommandApproval missing taskId — cannot resume",
    );
    return updated;
  }
  const lane = `task:${approval.taskId}`;
  await ctx.services.inbox
    .enqueueWork(ctx, approval.agentId, lane, {
      type: "resume_task",
      payload: { taskId: approval.taskId },
    })
    .catch((err) =>
      ctx.log.error(
        { err, commandApprovalId: approvalId, component: "shellGuard" },
        "Failed to ring doorbell after command approval",
      ),
    );

  return updated;
}
