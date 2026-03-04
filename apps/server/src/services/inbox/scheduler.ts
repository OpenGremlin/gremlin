import {
  CreateScheduleCommand,
  DeleteScheduleCommand,
  type FlexibleTimeWindowMode,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";
import { logger } from "../../logger.js";

let _scheduler: SchedulerClient | undefined;
function getSchedulerClient() {
  if (!_scheduler) _scheduler = new SchedulerClient({});
  return _scheduler;
}

const log = logger.child({ component: "scheduler" });

function getSchedulerConfig() {
  const targetArn = process.env.SCHEDULE_TARGET_LAMBDA_ARN;
  const roleArn = process.env.SCHEDULER_ROLE_ARN;
  if (!targetArn || !roleArn) {
    log.warn("Missing SCHEDULE_TARGET_LAMBDA_ARN or SCHEDULER_ROLE_ARN");
    return null;
  }
  return { targetArn, roleArn };
}

/**
 * Create a recurring EventBridge schedule for a cron job.
 */
export async function createCronSchedule(job: {
  id: string;
  agentId: string;
  name: string;
  cronExpression: string;
  description: string;
  timezone?: string;
}) {
  const config = getSchedulerConfig();
  if (!config) return;

  await getSchedulerClient().send(
    new CreateScheduleCommand({
      Name: `gremlin-job-${job.id}`,
      GroupName: "gremlin",
      ScheduleExpression: `cron(${job.cronExpression})`,
      ScheduleExpressionTimezone: job.timezone ?? "UTC",
      FlexibleTimeWindow: { Mode: "OFF" as FlexibleTimeWindowMode },
      Target: {
        Arn: config.targetArn,
        RoleArn: config.roleArn,
        Input: JSON.stringify({
          type: "scheduled_job",
          agentId: job.agentId,
          payload: {
            jobId: job.id,
            triggerTimeMs: 0,
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
    await getSchedulerClient().send(
      new DeleteScheduleCommand({
        Name: `gremlin-job-${jobId}`,
        GroupName: "gremlin",
      }),
    );
    log.info({ jobId }, "Deleted cron schedule");
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ResourceNotFoundException") {
      return;
    }
    throw err;
  }
}

/**
 * Create a one-shot EventBridge schedule for an agent self-follow-up.
 * Auto-deletes after firing (ActionAfterCompletion: DELETE).
 */
export async function createFollowUpSchedule(input: {
  taskId: string;
  agentId: string;
  delayMs: number;
  prompt: string;
}) {
  const config = getSchedulerConfig();
  if (!config) return;

  const fireAt = new Date(Date.now() + input.delayMs);
  const scheduleId = crypto.randomUUID();

  await getSchedulerClient().send(
    new CreateScheduleCommand({
      Name: `gremlin-followup-${scheduleId}`,
      GroupName: "gremlin",
      ScheduleExpression: `at(${fireAt.toISOString().replace(/\.\d{3}Z$/, "")})`,
      FlexibleTimeWindow: { Mode: "OFF" as FlexibleTimeWindowMode },
      ActionAfterCompletion: "DELETE",
      Target: {
        Arn: config.targetArn,
        RoleArn: config.roleArn,
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
