import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";

export function listJobsTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "List all of your scheduled jobs. Returns each job's id, name, description, recurrence, timezone, and paused status.",
    inputSchema: z.object({}),
    execute: async () => {
      const allJobs = await ctx.services.jobs.getJobs(ctx);
      const myJobs = allJobs.filter((j) => j.agentId === agentId);

      return {
        jobs: myJobs.map((j) => ({
          id: j.id,
          name: j.name,
          description: j.description,
          recurrence: j.recurrence,
          timezone: j.timezone,
          paused: j.paused,
        })),
      };
    },
  });
}

export function updateJobTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      "Update one of your existing scheduled jobs. You can change any combination of name, description, recurrence, timezone, or pause/unpause it. Use listJobs first to get the job ID.",
    inputSchema: z.object({
      jobId: z.string().describe("The ID of the job to update."),
      name: z.string().optional().describe("New name for the job."),
      description: z
        .string()
        .optional()
        .describe("New instructions for the job."),
      recurrence: z
        .string()
        .optional()
        .describe(
          'New natural-language schedule (e.g. "every weekday at 9am").',
        ),
      timezone: z
        .string()
        .optional()
        .describe("New IANA timezone for the schedule."),
      paused: z
        .boolean()
        .optional()
        .describe("Set to true to pause the job, false to resume it."),
    }),
    execute: async ({ jobId, ...input }) => {
      // Verify the job belongs to this agent
      const job = await ctx.services.jobs.getJob(ctx, jobId);
      if (!job || job.agentId !== agentId) {
        return { error: "Job not found or does not belong to you." };
      }

      const updated = await ctx.services.jobs.updateJob(ctx, jobId, input);

      return {
        jobId: updated.id,
        name: updated.name,
        description: updated.description,
        recurrence: updated.recurrence,
        cronExpression: updated.cronExpression,
        timezone: updated.timezone,
        paused: updated.paused,
      };
    },
  });
}

export function scheduleJobTool(ctx: ServiceContext, agentId: string) {
  return tool({
    description:
      'Schedule a new recurring job for yourself. The job will run automatically on the specified schedule. Provide a natural-language recurrence like "every weekday at 9am" or "every Monday and Thursday at 2pm".',
    inputSchema: z.object({
      name: z
        .string()
        .describe(
          'Short name for the job (e.g. "Daily standup summary", "Weekly report").',
        ),
      description: z
        .string()
        .describe(
          "Detailed instructions for what the job should do each time it runs. Be specific — this is the only context available when the job executes.",
        ),
      recurrence: z
        .string()
        .describe(
          'Natural-language schedule (e.g. "every weekday at 9am", "every Sunday at 6pm", "every 2 hours from 9am to 5pm on weekdays").',
        ),
      timezone: z
        .string()
        .describe(
          'IANA timezone for the schedule (e.g. "America/New_York", "Europe/London").',
        ),
    }),
    execute: async ({ name, description, recurrence, timezone }) => {
      const job = await ctx.services.jobs.createJob(ctx, {
        name,
        description,
        recurrence,
        timezone,
        agentId,
      });

      return {
        jobId: job.id,
        name: job.name,
        recurrence: job.recurrence,
        cronExpression: job.cronExpression,
        timezone: job.timezone,
        paused: job.paused,
      };
    },
  });
}
