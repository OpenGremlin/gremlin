import type { ServiceContext } from "../context.js";
import {
  renderTaskSystemPrompt,
  resolvePromptFlags,
} from "../prompts/index.js";
import type { Attachment } from "../tasks/attachment.js";
import { type AgentLaneContext, buildTaskTools } from "./agentLaneContext.js";
import { buildMainLaneContext } from "./compaction.js";
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
  // Cross-agent delegation: this task was created by a manager via the
  // `delegate` tool. The brief is the entire context — we must NOT
  // inherit main-lane history (the recipient's main lane is unrelated)
  // and we render the delegated-task system prompt section instead.
  const isCrossAgentDelegation =
    !!task.assignerAgentId && task.assignerAgentId !== task.agentId;

  // For initial background tasks, inherit the main lane conversation
  // so the task has full context without needing it re-described.
  // Skip this for delegated tasks — the brief is self-contained.
  if (isInitialDelegation && !isCrossAgentDelegation) {
    const mainLaneMessages = await buildMainLaneContext(ctx, task.agentId);
    if (mainLaneMessages.length > 0) {
      // Log the conversation context as a system message
      const contextLines = mainLaneMessages
        .map(
          (m) =>
            `[${m.role === "user" ? "User" : "You"}]: ${typeof m.content === "string" ? m.content : ""}`,
        )
        .join("\n\n");

      await writeAgentLog(ctx, {
        agentId: task.agentId,
        taskId,
        role: "SYSTEM",
        content: `[Conversation context]\n\n${contextLines}`,
      });
    }
  }

  // Log the prompt — SYSTEM for backgrounded tasks, USER for follow-up messages
  if (prompt) {
    await writeAgentLog(ctx, {
      agentId: task.agentId,
      taskId,
      role: opts?.role ?? "SYSTEM",
      content: prompt,
      attachments: opts?.attachments,
    });
  }

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
    isDelegated: isCrossAgentDelegation,
  });

  // Resolve the assigner's display name once so the delegated-task
  // section can address them by name. Falls back to the agentId if
  // the assigner record can't be loaded (e.g., deleted between
  // delegation and execution).
  let assignerName: string | undefined;
  if (isCrossAgentDelegation && task.assignerAgentId) {
    const assigner = await ctx.services.agents
      .getAgent(ctx, task.assignerAgentId)
      .catch(() => null);
    assignerName = assigner?.name ?? task.assignerAgentId;
  }

  let systemPrompt = renderTaskSystemPrompt(
    {
      name: agent.name,
      personality: agent.personality,
      role: agent.role,
      userDisplayName: displayName,
      userAbout: profile?.about,
      taskTitle: task.title,
      taskId,
      ...(isCrossAgentDelegation && task.brief && assignerName
        ? {
            delegated: {
              brief: task.brief,
              ...(task.successCriteria
                ? { successCriteria: task.successCriteria }
                : {}),
              assignerName,
            },
          }
        : {}),
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
