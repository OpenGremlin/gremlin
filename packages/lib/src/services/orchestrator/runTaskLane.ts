import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import type { Attachment } from "../tasks/attachment.js";
import { type AgentLaneContext, buildTaskTools } from "./agentLaneContext.js";
import { runLane } from "./runLane.js";
import { writeAgentLog } from "./writeAgentLog.js";

/**
 * Run an agent turn on a task's lane.
 * Receives a pre-built AgentLaneContext so agent/profile/skills
 * are never re-fetched within the same drain loop.
 */
export async function runTaskLane(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  taskId: string,
  prompt: string,
  opts?: { role?: "SYSTEM" | "USER"; attachments?: Attachment[] },
): Promise<string> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const { agent, profile, displayName, timezone, skillSummary } = agentLaneCtx;

  // Log the prompt — SYSTEM for delegated tasks, USER for follow-up messages
  await writeAgentLog(ctx, {
    agentId: task.agentId,
    taskId,
    role: opts?.role ?? "SYSTEM",
    content: prompt,
    attachments: opts?.attachments,
  });

  let systemPrompt = renderPrompt("taskSystem", {
    name: agent.name,
    soul: agent.soul,
    userDisplayName: displayName,
    userAbout: profile?.about,
    taskTitle: task.title,
    taskId,
  });

  if (skillSummary.promptSection) {
    systemPrompt += `\n\n${skillSummary.promptSection}`;
  }

  ctx.log.info(
    { agentId: task.agentId, taskId, systemPromptLength: systemPrompt.length },
    "Task lane system prompt: %s",
    systemPrompt,
  );

  return runLane(ctx, {
    agentId: task.agentId,
    taskId,
    systemPrompt,
    tools: buildTaskTools(ctx, agentLaneCtx, task.agentId, taskId),
    recallHint: prompt,
    timezone,
    initialPrompt: prompt,
  });
}
