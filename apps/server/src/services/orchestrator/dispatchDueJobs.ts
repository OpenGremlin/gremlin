import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { ServiceContext } from "../context.js";
import { computeLastDueTrigger } from "../jobs/computeLastDueTrigger.js";
import { runTaskLane } from "./runTaskLane.js";

/**
 * Loop through all non-PAUSED AgentJobs with a cronExpression,
 * compute the most recent due trigger, and create a Task + CronJobTrigger
 * in a DDB transaction (exactly-once dedup).
 *
 * Called every 60 seconds by the cron interval.
 */
export async function dispatchDueJobs(ctx: ServiceContext) {
  const jobs = await ctx.services.jobs.getJobs(ctx);
  const profile = await ctx.services.profile.getProfile(ctx, "default");
  const timezone = profile?.timezone ?? "UTC";

  for (const job of jobs) {
    if (job.status === "PAUSED") continue;
    if (!job.cronExpression) continue;

    const triggerTimeMs = computeLastDueTrigger(job.cronExpression, Date.now(), timezone);
    if (triggerTimeMs === null) continue;

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
                  sk: `TRIGGER#${triggerTimeMs}`,
                  jobId: job.id,
                  triggerTimeMs: String(triggerTimeMs),
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
                  gsi1pk: `TASK_AGENT#${job.agentId}`,
                  gsi1sk: now,
                  id: taskId,
                  agentId: job.agentId,
                  title: job.name,
                  status: "PENDING",
                  message: null,
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

      console.log(
        `[orchestrator] Triggered job "${job.name}" → task ${taskId}`,
      );

      // Fire-and-forget — don't block the cron for slow agent turns
      runTaskLane(ctx, taskId, job.description).catch((err) => {
        console.error(
          `[orchestrator] Failed to run task ${taskId} for job "${job.name}":`,
          err,
        );
      });
    } catch (err: unknown) {
      // Transaction cancelled = CronJobTrigger already exists → skip
      if (
        err instanceof Error &&
        err.name === "TransactionCanceledException"
      ) {
        continue;
      }
      console.error(
        `[orchestrator] Failed to dispatch job "${job.name}":`,
        err,
      );
    }
  }
}
