import {
  CreateScheduleCommand,
  type FlexibleTimeWindowMode,
} from "@aws-sdk/client-scheduler";
import {
  getSchedulerClient,
  getSchedulerConfig,
  log,
} from "./schedulerClient.js";

/**
 * Convert a standard 5-field cron expression to AWS EventBridge 6-field format.
 * AWS requires: min hour day-of-month month day-of-week year
 * and one of day-of-month or day-of-week must be "?" when the other is set.
 */
function toAwsCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length === 6) return expr; // already 6-field
  if (parts.length !== 5) return expr; // let AWS reject it
  const [min, hour, dom, month, dow] = parts;
  // If day-of-week is specified (not *), use ? for day-of-month
  if (dow !== "*") return `${min} ${hour} ? ${month} ${dow} *`;
  // If day-of-month is specified (not *), use ? for day-of-week
  if (dom !== "*") return `${min} ${hour} ${dom} ${month} ? *`;
  // Both are *, default to ? for day-of-week
  return `${min} ${hour} ${dom} ${month} ? *`;
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
      ScheduleExpression: `cron(${toAwsCron(job.cronExpression)})`,
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
