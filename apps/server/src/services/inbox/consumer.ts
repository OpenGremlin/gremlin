import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { InboxItemItem } from "../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../context.js";

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
      await routeBatch(ctx, agentId, items);
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

    await ctx.services.orchestrator.runMainLane(ctx, agentId, recallHint);
  }

  // --- Task lane: each item is independent, run in parallel ---
  await Promise.all(
    taskLaneItems.map(async (item) => {
      const payload = JSON.parse(item.payload);
      switch (item.type) {
        case "run_task":
          await ctx.services.orchestrator.runTaskLane(
            ctx,
            payload.taskId,
            payload.prompt,
          );
          break;
        case "user_task_message":
          await ctx.services.orchestrator.runTaskLane(
            ctx,
            payload.taskId,
            payload.content,
            { role: "USER" },
          );
          break;
        case "scheduled_job":
          await handleScheduledJob(ctx, agentId, payload);
          break;
        case "agent_self_followup":
          await ctx.services.orchestrator.runTaskLane(
            ctx,
            payload.taskId,
            payload.prompt,
          );
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
    }),
  );
}

/**
 * Process a scheduled job: dedup via TransactWrite, create task,
 * anchor in main-lane log, then run.
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

  const taskId = crypto.randomUUID();
  const now = new Date().toISOString();
  const table = ctx.resources.ddb.table;
  const tableName = table.getName();

  try {
    await table.getDocumentClient().send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: {
                _et: "CronJobTrigger",
                pk: `AGENT_JOB#${job.id}`,
                sk: `TRIGGER#${payload.triggerTimeMs}`,
                jobId: job.id,
                triggerTimeMs: String(payload.triggerTimeMs),
                taskId,
                createdAt: now,
              },
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                _et: "Task",
                pk: "TASK",
                sk: `TASK#${taskId}`,
                gsi1pk: `TASK_AGENT#${agentId}`,
                gsi1sk: now,
                gsi2pk: "TASK_ALL",
                gsi2sk: `${now}#${taskId}`,
                id: taskId,
                agentId,
                title: job.name,
                status: "PENDING",
                message: null,
                image: null,
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                originJobId: job.id,
                artifacts: [],
              },
            },
          },
        ],
      }),
    );
  } catch (err: unknown) {
    // Transaction cancelled = CronJobTrigger already exists → skip
    if (err instanceof Error && err.name === "TransactionCanceledException") {
      return;
    }
    throw err;
  }

  ctx.log.info(
    { jobId: job.id, jobName: job.name, taskId },
    "Triggered job → task created",
  );

  // Anchor in main-lane log so the UI can attach the sub-thread
  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId,
    taskId: null,
    role: "SYSTEM",
    content: `Scheduled task started: ${job.name}`,
  });

  await ctx.services.orchestrator.runTaskLane(ctx, taskId, job.description);
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
