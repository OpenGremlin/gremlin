import type { ToolName } from "../../../enums.js";
import type { ServiceContext } from "../../context.js";

/**
 * Process a scheduled job: create a task linked to the job, write a
 * delegation log entry to the main lane, and run on the task lane.
 */
export async function handleScheduledJob(
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

  void ctx.services.tasks.selectAndSetTaskEmoji(ctx, task);

  const prompt = `[Scheduled Job] This task was triggered automatically by the scheduled job "${job.name}". Below are the user's instructions for this job:\n\n${job.description}`;

  // Write a delegation log entry to the main lane so it's visible in chat
  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId,
    taskId: null,
    role: "TOOL",
    // Legacy tool name for scheduled job log entries — the BackgroundTask
    // enum value is deprecated but kept for backward compat — old
    // UI clients still render cards based on this string.
    toolName: "backgroundTask" as ToolName,
    toolInput: { title: job.name, prompt },
    toolResult: { taskId: task.id, title: job.name },
  });

  await ctx.services.inbox.enqueueWork(ctx, agentId, `task:${task.id}`, {
    type: "run_task",
    payload: { taskId: task.id, prompt },
  });
}
