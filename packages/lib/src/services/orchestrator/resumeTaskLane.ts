import type { ServiceContext } from "../context.js";
import {
  renderTaskSystemPrompt,
  resolvePromptFlags,
} from "../prompts/index.js";
import { type AgentLaneContext, buildTaskTools } from "./agentLaneContext.js";
import { runLane } from "./runLane.js";

/**
 * Resume inference on a task lane from existing conversation history.
 * Unlike runTaskLane, this does NOT write a new message to the log —
 * it just rebuilds context and runs a turn. Used after command approval
 * resolution where the log was already updated in-place.
 */
export async function resumeTaskLane(
  ctx: ServiceContext,
  agentLaneCtx: AgentLaneContext,
  taskId: string,
): Promise<string> {
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const { agent, profile, displayName, timezone, skillSummary } = agentLaneCtx;

  const flags = resolvePromptFlags(agent.config, {
    modelSupportsImages: agentLaneCtx.modelSupportsImages,
    hasSkills: !!agentLaneCtx.skillSummary.promptSection,
    hasPlan: true,
  });

  let systemPrompt = renderTaskSystemPrompt(
    {
      name: agent.name,
      soul: agent.soul,
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

  return runLane(ctx, {
    agentId: task.agentId,
    taskId,
    systemPrompt,
    tools: buildTaskTools(ctx, agentLaneCtx, task.agentId, taskId),
    timezone,
    reasoningEnabled:
      (agent.config?.reasoning?.enabled ?? false) &&
      agentLaneCtx.modelSupportsReasoning,
    ...(agentLaneCtx.speechConnectionId
      ? {
          speech: {
            voice: agentLaneCtx.speechVoice,
            connectionId: agentLaneCtx.speechConnectionId,
          },
        }
      : {}),
  });
}
