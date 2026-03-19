import type { InboxItemItem } from "../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../context.js";
import type { AgentLaneContext } from "../orchestrator/agentLaneContext.js";

/**
 * In-memory set to enforce per-agent serialization.
 * Only one drain loop runs per agent at a time.
 * Redundant doorbells while an agent is active are no-ops.
 */
const activeAgents = new Set<string>();

/**
 * Ring the doorbell for an agent.
 * If the agent is already processing, the active drain loop will
 * pick up new items automatically — this call is a no-op.
 */
export async function ringDoorbell(
  ctx: ServiceContext,
  agentId: string,
): Promise<void> {
  if (activeAgents.has(agentId)) {
    ctx.log.info({ agentId }, "Agent already active, skipping doorbell");
    return;
  }

  ctx.log.info({ agentId }, "Agent waking up");
  activeAgents.add(agentId);
  try {
    const agentLaneCtx = await ctx.services.orchestrator.buildAgentLaneContext(
      ctx,
      agentId,
    );

    while (true) {
      const items = await ctx.services.inbox.getUnreadItems(ctx, agentId);
      if (items.length === 0) break;

      ctx.log.info(
        {
          agentId,
          itemCount: items.length,
          types: items.map((i) => i.type),
        },
        "Agent picked up inbox items",
      );

      await ctx.services.inbox.markRead(ctx, items);
      await routeBatch(ctx, agentLaneCtx, agentId, items);
    }
  } catch (err) {
    ctx.log.error({ err, agentId }, "Consumer error");
  } finally {
    ctx.log.info({ agentId }, "Agent going back to sleep");
    activeAgents.delete(agentId);
  }
}

/**
 * Split a batch of inbox items into main-lane (conversational) and
 * task-lane (dispatched work), then process each group.
 *
 * Main lane runs first so the user gets a response before background tasks.
 */
async function routeBatch(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  agentId: string,
  items: InboxItemItem[],
) {
  const mainLaneItems = items.filter(
    (i) => i.type === "user_message" || i.type === "user_notification_reply",
  );
  const taskLaneItems = items.filter(
    (i) =>
      i.type === "run_task" ||
      i.type === "user_task_message" ||
      i.type === "scheduled_job" ||
      i.type === "agent_self_followup" ||
      i.type === "core_memory_review",
  );

  // --- Main lane: batch all conversational items into one turn ---
  if (mainLaneItems.length > 0) {
    let recallHint: string | undefined;

    for (const item of mainLaneItems) {
      const payload = JSON.parse(item.payload);
      switch (item.type) {
        case "user_message":
          // Write the user message to the log now (at processing time, not send time)
          await ctx.services.orchestrator.writeAgentLog(ctx, {
            agentId,
            taskId: null,
            role: "USER",
            content: payload.content,
          });
          recallHint = payload.content;
          break;
        case "user_notification_reply":
          await formatAndWriteNotificationReply(ctx, agentId, payload);
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

  // --- Task lane: group by taskId, write all messages per task,
  // then run one inference per task. Different tasks run in parallel. ---
  const taskGroups = new Map<string, InboxItemItem[]>();
  const nonTaskItems: InboxItemItem[] = [];

  for (const item of taskLaneItems) {
    const payload = JSON.parse(item.payload);
    const tid = payload.taskId;
    if (tid) {
      const group = taskGroups.get(tid) ?? [];
      group.push(item);
      taskGroups.set(tid, group);
    } else {
      nonTaskItems.push(item);
    }
  }

  await Promise.all([
    // One inference per task, with all messages written to history first
    ...[...taskGroups.entries()].map(([taskId, items]) =>
      processTaskGroup(ctx, agentLaneCtx, agentId, taskId, items),
    ),
    // Non-task items run in parallel
    ...nonTaskItems.map((item) => processNonTaskItem(ctx, agentId, item)),
  ]);
}

/** Write all messages for a task to the log, then run one inference. */
async function processTaskGroup(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  agentId: string,
  taskId: string,
  items: InboxItemItem[],
) {
  // Collect prompts — each gets logged, but only one inference runs at the end
  const prompts: Array<{ content: string; role: "SYSTEM" | "USER" }> = [];

  for (const item of items) {
    const payload = JSON.parse(item.payload);
    switch (item.type) {
      case "run_task":
        prompts.push({ content: payload.prompt, role: "SYSTEM" });
        break;
      case "user_task_message":
        prompts.push({ content: payload.content, role: "USER" });
        break;
      case "scheduled_job":
        await handleScheduledJob(ctx, agentId, payload);
        return; // scheduled jobs handle their own inference
      case "agent_self_followup":
        prompts.push({ content: payload.prompt, role: "SYSTEM" });
        break;
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
    });
  }

  // Run one inference with the last prompt
  const last = prompts[prompts.length - 1];
  await ctx.services.orchestrator.runTaskLane(
    ctx,
    agentLaneCtx,
    taskId,
    last.content,
    last.role === "USER" ? { role: "USER" } : undefined,
  );
}

async function processNonTaskItem(
  ctx: ServiceContext,
  agentId: string,
  item: InboxItemItem,
) {
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
    toolName: "delegateTask",
    toolInput: { title: job.name, prompt },
    toolResult: { taskId: task.id, title: job.name },
  });

  await ctx.services.inbox.enqueueWork(ctx, agentId, {
    type: "run_task",
    payload: { taskId: task.id, prompt },
  });
}

/**
 * Load the original notification and write a SYSTEM message to the
 * agent's main-lane log with enough context to act on the reply.
 */
async function formatAndWriteNotificationReply(
  ctx: ServiceContext,
  agentId: string,
  payload: { notificationId: string; actionId: string },
) {
  const notification = await ctx.services.notifications.getNotification(
    ctx,
    payload.notificationId,
  );

  let content: string;
  if (notification) {
    const actionLabel =
      notification.actions.find((a) => a.id === payload.actionId)?.label ??
      payload.actionId;
    content = `The user responded to your approval request.\nRequest: "${notification.message}"\nUser selected: "${actionLabel}"`;
  } else {
    content = `The user responded to notification ${payload.notificationId} with action: ${payload.actionId}`;
  }

  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId,
    taskId: null,
    role: "SYSTEM",
    content,
  });
}
