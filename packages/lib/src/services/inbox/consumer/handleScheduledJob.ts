import type { ToolName } from "../../../enums.js";
import type { ServiceContext } from "../../context.js";

/**
 * Process a scheduled job: create a task linked to the job, write a
 * delegation log entry to the main lane, and dispatch the task lane.
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
    instructions: job.description,
  });

  void ctx.services.tasks.selectAndSetTaskEmoji(ctx, task);

  // Write a log entry to the main lane so the run appears in chat.
  await ctx.services.orchestrator.writeAgentLog(ctx, {
    agentId,
    taskId: null,
    role: "TOOL",
    // Legacy tool name for scheduled job log entries — the BackgroundTask
    // enum value is deprecated but kept for backward compat — old
    // UI clients still render cards based on this string.
    toolName: "backgroundTask" as ToolName,
    toolInput: { title: job.name, prompt: job.description },
    toolResult: { taskId: task.id, title: job.name },
  });

  await ctx.services.orchestrator.dispatchTask(ctx, task);
}
