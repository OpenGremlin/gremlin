import { DeleteScheduleCommand } from "@aws-sdk/client-scheduler";
import { getSchedulerClient, log } from "./schedulerClient.js";

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
