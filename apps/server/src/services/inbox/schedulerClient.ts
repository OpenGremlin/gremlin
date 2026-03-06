import { SchedulerClient } from "@aws-sdk/client-scheduler";
import { logger } from "../../logger.js";

let _scheduler: SchedulerClient | undefined;
export function getSchedulerClient() {
  if (!_scheduler)
    _scheduler = new SchedulerClient({
      ...(process.env.LOCALSTACK_ENDPOINT && {
        endpoint: process.env.LOCALSTACK_ENDPOINT,
      }),
    });
  return _scheduler;
}

export const log = logger.child({ component: "scheduler" });

export function getSchedulerConfig() {
  const targetArn = process.env.SCHEDULE_TARGET_LAMBDA_ARN;
  const roleArn = process.env.SCHEDULER_ROLE_ARN;
  if (!targetArn || !roleArn) {
    log.warn("Missing SCHEDULE_TARGET_LAMBDA_ARN or SCHEDULER_ROLE_ARN");
    return null;
  }
  return { targetArn, roleArn };
}
