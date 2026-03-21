import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { CommandApprovalDecision, CommandApprovalStatus } from "../../enums.js";
import type { ServiceContext } from "../context.js";
import { createAllowlistStore } from "./allowlistStore.js";
import { getCommandApproval } from "./getCommandApproval.js";
import { analyzeCommand } from "./shellParse.js";

/**
 * Resolve a CommandApproval: update status, persist allowlist if needed,
 * and ring the doorbell so the consumer can execute + resume.
 *
 * Command execution is intentionally deferred to the consumer's drain loop
 * so that the lane is marked active in `activeLanes`, which blocks new
 * inbox items from being processed while the command runs.
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

  ctx.resources.pubsub.publish("pendingItemsUpdated");

  // 3. Persist to allowlist for "allow always"
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

  // 4. Enqueue resume_task with the approvalId so the consumer can
  //    execute the command (or write denial) inside its drain loop.
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
      payload: { taskId: approval.taskId, approvalId },
    })
    .catch((err) =>
      ctx.log.error(
        { err, commandApprovalId: approvalId, component: "shellGuard" },
        "Failed to ring doorbell after command approval",
      ),
    );

  return updated;
}
