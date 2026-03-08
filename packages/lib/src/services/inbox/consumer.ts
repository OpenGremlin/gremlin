import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { createLogger } from "../../logger.js";
import type { InboxItemItem } from "../../resources/ddb/schema/inboxItem.js";
import type { ServiceContext } from "../context.js";
import { activeSessions } from "../orchestrator/sandboxTools.js";

const sandboxLog = createLogger("sandbox:consumer");

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
      i.type === "core_memory_review" ||
      i.type === "sandbox_available", // kept for backwards compat with in-flight items
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
      processTaskGroup(ctx, agentId, taskId, items),
    ),
    // Non-task items run in parallel
    ...nonTaskItems.map((item) => processNonTaskItem(ctx, agentId, item)),
  ]);
}

/** Write all messages for a task to the log, then run one inference. */
async function processTaskGroup(
  ctx: ServiceContext,
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
      case "sandbox_available": {
        // Connect the WebSocket now that the sandbox is healthy
        const instanceId = payload.instanceId as string | undefined;
        if (instanceId) {
          try {
            const session = await ctx.services.sandbox.tryQuickConnect(
              agentId,
              instanceId,
            );
            if (session) {
              await ctx.services.sandbox.connectToSandbox(session);
              session.lastActivityAt = Date.now();
              activeSessions.set(agentId, session);
              sandboxLog.info(
                { agentId, instanceId },
                "Sandbox connected via notify hook",
              );
            }
          } catch (err) {
            sandboxLog.error(
              { agentId, instanceId, error: (err as Error).message },
              "Failed to connect sandbox after notify",
            );
          }
        }
        prompts.push({
          content: "The sandbox is now available. Proceed with your task.",
          role: "SYSTEM",
        });
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
    });
  }

  // Run one inference with the last prompt
  const last = prompts[prompts.length - 1];
  await ctx.services.orchestrator.runTaskLane(
    ctx,
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
  switch (item.type) {
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
