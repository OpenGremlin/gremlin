import type { ServiceContext } from "../context.js";
import {
  renderTaskSystemPrompt,
  resolvePromptFlags,
} from "../prompts/index.js";
import type { Attachment } from "../tasks/attachment.js";
import { type AgentLaneContext, buildTaskTools } from "./agentLaneContext.js";
import { formatPlan, generatePlan } from "./generatePlan.js";
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
  const isInitialDelegation = (opts?.role ?? "SYSTEM") === "SYSTEM";

  // Log the prompt — SYSTEM for delegated tasks, USER for follow-up messages
  await writeAgentLog(ctx, {
    agentId: task.agentId,
    taskId,
    role: opts?.role ?? "SYSTEM",
    content: prompt,
    attachments: opts?.attachments,
  });

  // Generate an execution plan for new task delegations
  let planText: string | undefined;
  if (isInitialDelegation) {
    try {
      const plan = await generatePlan(ctx, task.agentId, task.title, prompt);
      planText = formatPlan(plan);

      // Log the plan so it's visible in the task timeline and conversation history
      await writeAgentLog(ctx, {
        agentId: task.agentId,
        taskId,
        role: "SYSTEM",
        content: `[Execution plan]\n\n${planText}`,
      });
    } catch (err) {
      ctx.log.warn(
        { err, agentId: task.agentId, taskId },
        "Plan generation failed, proceeding without plan",
      );
    }
  }

  const flags = resolvePromptFlags(agent.config, {
    modelSupportsImages: agentLaneCtx.modelSupportsImages,
    hasSkills: !!agentLaneCtx.skillSummary.promptSection,
    hasPlan: !!planText,
  });

  let systemPrompt = renderTaskSystemPrompt(
    {
      name: agent.name,
      soul: agent.soul,
      identity: agent.identity,
      userDisplayName: displayName,
      userAbout: profile?.about,
      taskTitle: task.title,
      taskId,
    },
    flags,
  );

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
    reasoningEnabled:
      (agent.config?.reasoning?.enabled ?? false) &&
      agentLaneCtx.modelSupportsReasoning,
    initialPrompt: prompt,
  });
}
