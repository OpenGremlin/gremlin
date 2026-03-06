import {
  CreateScheduleCommand,
  type FlexibleTimeWindowMode,
} from "@aws-sdk/client-scheduler";
import { getSchedulerClient, getSchedulerConfig, log } from "./schedulerClient.js";

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
