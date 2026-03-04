import {
  CreateScheduleCommand,
  DeleteScheduleCommand,
  type FlexibleTimeWindowMode,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";
import { logger } from "../../logger.js";

const scheduler = new SchedulerClient({});
const log = logger.child({ component: "scheduler" });

/**
 * Create a recurring EventBridge schedule for a cron job.
 * The schedule fires the scheduleTarget Lambda which writes
 * an inbox item and rings the doorbell.
 */
export async function createCronSchedule(job: {
  id: string;
  agentId: string;
  name: string;
  cronExpression: string;
  description: string;
  timezone?: string;
}) {
  const targetArn = process.env.SCHEDULE_TARGET_LAMBDA_ARN;
  const roleArn = process.env.SCHEDULER_ROLE_ARN;
  if (!targetArn || !roleArn) {
    log.warn(
      "Missing SCHEDULE_TARGET_LAMBDA_ARN or SCHEDULER_ROLE_ARN, skipping schedule creation",
    );
    return;
  }

  await scheduler.send(
    new CreateScheduleCommand({
      Name: `gremlin-job-${job.id}`,
      GroupName: "gremlin",
      ScheduleExpression: `cron(${job.cronExpression})`,
      ScheduleExpressionTimezone: job.timezone ?? "UTC",
      FlexibleTimeWindow: { Mode: "OFF" as FlexibleTimeWindowMode },
      Target: {
        Arn: targetArn,
        RoleArn: roleArn,
        Input: JSON.stringify({
          type: "scheduled_job",
          agentId: job.agentId,
          payload: {
            jobId: job.id,
            triggerTimeMs: 0, // filled at runtime by Lambda
          },
        }),
      },
    }),
  );

  log.info({ jobId: job.id, jobName: job.name }, "Created cron schedule");
}

/**
 * Delete the EventBridge schedule for a cron job.
 */
export async function deleteCronSchedule(jobId: string) {
  try {
    await scheduler.send(
      new DeleteScheduleCommand({
        Name: `gremlin-job-${jobId}`,
        GroupName: "gremlin",
      }),
    );
    log.info({ jobId }, "Deleted cron schedule");
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ResourceNotFoundException") {
      return; // already deleted
    }
    throw err;
  }
}

/**
 * Create a one-shot EventBridge schedule for an agent self-follow-up.
 * The schedule auto-deletes after firing (ActionAfterCompletion: DELETE).
 */
export async function createFollowUpSchedule(input: {
  taskId: string;
  agentId: string;
  delayMs: number;
  prompt: string;
}) {
  const targetArn = process.env.SCHEDULE_TARGET_LAMBDA_ARN;
  const roleArn = process.env.SCHEDULER_ROLE_ARN;
  if (!targetArn || !roleArn) {
    log.warn(
      "Missing SCHEDULE_TARGET_LAMBDA_ARN or SCHEDULER_ROLE_ARN, skipping follow-up schedule",
    );
    return;
  }

  const fireAt = new Date(Date.now() + input.delayMs);
  const scheduleId = crypto.randomUUID();

  await scheduler.send(
    new CreateScheduleCommand({
      Name: `gremlin-followup-${scheduleId}`,
      GroupName: "gremlin",
      ScheduleExpression: `at(${fireAt.toISOString().replace(/\.\d{3}Z$/, "")})`,
      FlexibleTimeWindow: { Mode: "OFF" as FlexibleTimeWindowMode },
      ActionAfterCompletion: "DELETE",
      Target: {
        Arn: targetArn,
        RoleArn: roleArn,
        Input: JSON.stringify({
          type: "agent_self_followup",
          agentId: input.agentId,
          payload: {
            taskId: input.taskId,
            prompt: input.prompt,
          },
        }),
      },
    }),
  );

  log.info(
    { scheduleId, fireAt: fireAt.toISOString() },
    "Created follow-up schedule",
  );

  return { scheduleId, fireAt: fireAt.toISOString() };
}
