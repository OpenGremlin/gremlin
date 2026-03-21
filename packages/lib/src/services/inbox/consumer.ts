import { CommandApprovalDecision, ToolName } from "../../enums.js";
import type { InboxItemItem } from "../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../context.js";
import type { AgentLaneContext } from "../orchestrator/agentLaneContext.js";
import { activeSessions } from "../orchestrator/sandboxTools.js";
import { updateAgentLogResult } from "../orchestrator/writeAgentLog.js";
import type { Attachment } from "../tasks/attachment.js";

/**
 * Tracks which lanes are currently draining.
 * When a lane finishes a turn it always re-checks the inbox,
 * so a doorbell that arrives while a lane is active is safe to ignore.
 */
const activeLanes = new Set<string>();

function laneKey(agentId: string, lane: string): string {
  return `${agentId}#${lane}`;
}

// ---------------------------------------------------------------------------
// Doorbell entry point
// ---------------------------------------------------------------------------

/**
 * Ring the doorbell for a specific agent + lane.
 * If the lane is already draining, this is a no-op — the active drain
 * loop will re-check the inbox after its current turn finishes.
 */
export async function ringDoorbell(
  ctx: ServiceContext,
  agentId: string,
  lane: string,
): Promise<void> {
  const key = laneKey(agentId, lane);

  if (activeLanes.has(key)) {
    ctx.log.info({ agentId, lane }, "Lane already active, skipping doorbell");
    return;
  }

  ctx.log.info({ agentId, lane }, "Lane waking up");
  activeLanes.add(key);
  try {
    const agentLaneCtx = await ctx.services.orchestrator.buildAgentLaneContext(
      ctx,
      agentId,
    );

    while (true) {
      const items = await ctx.services.inbox.getUnreadItems(ctx, agentId, lane);
      if (items.length === 0) break;

      ctx.log.info(
        {
          agentId,
          lane,
          itemCount: items.length,
          types: items.map((i) => i.type),
        },
        "Lane picked up inbox items",
      );

      await ctx.services.inbox.markRead(ctx, items);

      if (lane === "main") {
        await processMainLaneItems(ctx, agentLaneCtx, agentId, items);
      } else if (lane.startsWith("task:")) {
        const taskId = lane.slice(5);

        // Guard: don't start a new turn if there's a pending command approval.
        // Items stay marked read — when the approval resolves, the doorbell
        // will re-trigger and the consumer will process them.
        const pending = await ctx.services.shellGuard.hasPendingApproval(
          ctx,
          agentId,
          taskId,
        );
        if (pending) {
          ctx.log.info(
            { agentId, taskId, lane },
            "Skipping turn — pending command approval",
          );
          break;
        }

        // Check if any items are resume_task — these skip the prompt flow
        // and re-run inference directly from existing conversation history.
        const resumeItems = items.filter((i) => i.type === "resume_task");
        const nonResumeItems = items.filter((i) => i.type !== "resume_task");

        // If a resume carries an approvalId, execute the approved command
        // (or write denial) before resuming inference. This runs inside the
        // drain loop so activeLanes blocks concurrent doorbells.
        for (const ri of resumeItems) {
          const rPayload = JSON.parse(ri.payload);
          if (rPayload.approvalId) {
            await executeApprovedCommand(ctx, rPayload.approvalId);
          }
        }

        if (nonResumeItems.length > 0) {
          await processTaskGroup(
            ctx,
            agentLaneCtx,
            agentId,
            taskId,
            nonResumeItems,
          );
        } else if (resumeItems.length > 0) {
          await ctx.services.orchestrator.resumeTaskLane(
            ctx,
            agentLaneCtx,
            taskId,
          );
        }
      } else if (lane === "system") {
        await processSystemItems(ctx, agentId, items);
      }
    }
  } catch (err) {
    ctx.log.error({ err, agentId, lane }, "Lane drain error");
  } finally {
    ctx.log.info({ agentId, lane }, "Lane going back to sleep");
    activeLanes.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Command approval execution
// ---------------------------------------------------------------------------

/**
 * Execute a resolved CommandApproval and update its agent log entry in-place.
 * Called inside the consumer drain loop so the lane stays in `activeLanes`.
 */
async function executeApprovedCommand(
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

// ---------------------------------------------------------------------------
// Lane processors
// ---------------------------------------------------------------------------

/** Process main-lane (conversational) items: write to log, then run one inference. */
async function processMainLaneItems(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  agentId: string,
  items: InboxItemItem[],
): Promise<void> {
  let recallHint: string | undefined;

  for (const item of items) {
    const payload = JSON.parse(item.payload);
    switch (item.type) {
      case "user_message":
        await ctx.services.orchestrator.writeAgentLog(ctx, {
          agentId,
          taskId: null,
          role: "USER",
          content: payload.content,
        });
        recallHint = payload.content;
        break;
      case "user_input_request_reply":
        await formatAndWriteInputRequestReply(ctx, agentId, null, payload);
        break;
    }
  }

  await ctx.services.orchestrator.runMainLane(
    ctx,
    agentLaneCtx,
    agentId,
    recallHint,
  );
}

/** Write all messages for a task to the log, then run one inference. */
async function processTaskGroup(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  agentId: string,
  taskId: string,
  items: InboxItemItem[],
) {
  const prompts: Array<{
    content: string;
    role: "SYSTEM" | "USER";
    attachments?: Attachment[];
  }> = [];

  for (const item of items) {
    const payload = JSON.parse(item.payload);
    switch (item.type) {
      case "run_task":
        prompts.push({
          content: payload.prompt,
          role: "SYSTEM",
          attachments: payload.attachments,
        });
        break;
      case "user_task_message":
        prompts.push({ content: payload.content, role: "USER" });
        break;
      case "agent_self_followup":
        prompts.push({ content: payload.prompt, role: "SYSTEM" });
        break;
      case "user_input_request_reply": {
        const reply = await buildInputRequestReplyContent(ctx, payload);
        prompts.push({ content: reply, role: "SYSTEM" });
        break;
      }
    }
  }

  if (prompts.length === 0) return;

  // Write all prompts to the log except the last one (runTaskLane writes that)
  for (let i = 0; i < prompts.length - 1; i++) {
    await ctx.services.orchestrator.writeAgentLog(ctx, {
      agentId,
      taskId,
      role: prompts[i].role,
      content: prompts[i].content,
      attachments: prompts[i].attachments,
    });
  }

  // Run one inference with the last prompt
  const last = prompts[prompts.length - 1];
  await ctx.services.orchestrator.runTaskLane(
    ctx,
    agentLaneCtx,
    taskId,
    last.content,
    {
      role: last.role === "USER" ? "USER" : undefined,
      attachments: last.attachments,
    },
  );
}

/** Process system-lane items (scheduled jobs, core memory reviews). No inference. */
async function processSystemItems(
  ctx: ServiceContext,
  agentId: string,
  items: InboxItemItem[],
): Promise<void> {
  for (const item of items) {
    const payload = JSON.parse(item.payload);
    switch (item.type) {
      case "scheduled_job":
        await handleScheduledJob(ctx, agentId, payload);
        break;
      case "core_memory_review":
        await ctx.services.memory
          .reviewCoreMemories(ctx, agentId)
          .catch((err) =>
            ctx.log.error(
              { err, component: "core-memories" },
              "Core memory review failed",
            ),
          );
        break;
    }
  }
}

/**
 * Process a scheduled job: create a task linked to the job, write a
 * delegation log entry to the main lane, and run on the task lane.
 */
async function handleScheduledJob(
  ctx: ServiceContext,
  agentId: string,
  payload: { jobId: string; triggerTimeMs: number },
) {
  const job = await ctx.services.jobs.getJob(ctx, payload.jobId);
  if (!job) {
    ctx.log.warn({ jobId: payload.jobId }, "Scheduled job not found");
    return;
  }

  if (job.paused) {
    ctx.log.info({ jobId: job.id, jobName: job.name }, "Skipping paused job");
    return;
  }

  ctx.log.info(
    { jobId: job.id, jobName: job.name },
    "Triggered scheduled job → task lane",
  );

  const task = await ctx.services.tasks.createTask(ctx, {
    agentId,
    title: job.name,
    originJobId: job.id,
  });

  void ctx.services.tasks.selectAndSetTaskImage(ctx, task);

  const prompt = `[Scheduled Job] This task was triggered automatically by the scheduled job "${job.name}". Below are the user's instructions for this job:\n\n${job.description}`;

  // Write a delegation log entry to the main lane so it's visible in chat
  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId,
    taskId: null,
    role: "TOOL",
    toolName: ToolName.DelegateTask,
    toolInput: { title: job.name, prompt },
    toolResult: { taskId: task.id, title: job.name },
  });

  await ctx.services.inbox.enqueueWork(ctx, agentId, `task:${task.id}`, {
    type: "run_task",
    payload: { taskId: task.id, prompt },
  });
}

async function buildInputRequestReplyContent(
  ctx: ServiceContext,
  payload: { requestId: string; action: string },
): Promise<string> {
  const request = await ctx.services.userInputRequests.getUserInputRequest(
    ctx,
    payload.requestId,
  );

  if (request) {
    return `The user responded to your approval request.\nRequest: "${request.message}"\nUser selected: "${payload.action}"`;
  }
  return `The user responded to a request with action: ${payload.action}`;
}

/**
 * Load the original user input request and write a SYSTEM message to the
 * appropriate lane log with enough context to act on the reply.
 */
async function formatAndWriteInputRequestReply(
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
  payload: { requestId: string; action: string },
) {
  const content = await buildInputRequestReplyContent(ctx, payload);
  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId,
    taskId,
    role: "SYSTEM",
    content,
  });
}
