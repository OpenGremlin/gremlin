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
 * Build a context summary of related tasks and their outputs.
 * For child tasks: shows sibling tasks and their attached files.
 * For epic tasks: shows children and their attached files.
 */
async function buildRelatedTaskContext(
  ctx: ServiceContext,
  task: { id: string; parentId?: string },
): Promise<string | null> {
  let relatedTasks: Awaited<ReturnType<typeof ctx.services.tasks.getChildren>>;

  // Check if this task has children (parent role)
  const ownChildren = await ctx.services.tasks.getChildren(ctx, task.id);
  if (ownChildren.length > 0) {
    relatedTasks = ownChildren;
  } else if (task.parentId) {
    // Child: show siblings (exclude self)
    const siblings = await ctx.services.tasks.getChildren(ctx, task.parentId);
    relatedTasks = siblings.filter((s) => s.id !== task.id);
  } else {
    return null;
  }

  if (relatedTasks.length === 0) return null;

  const lines: string[] = ["[Related tasks and their outputs]\n"];

  for (const related of relatedTasks) {
    const attachments = await ctx.services.tasks
      .getTaskAttachments(ctx, related.id)
      .catch(() => []);
    const statusStr = related.status === "closed" ? "done" : related.status;
    lines.push(`• "${related.title}" (${statusStr})`);
    if (attachments.length > 0) {
      for (const att of attachments) {
        if (att.type === "file") {
          lines.push(`  - ${att.path}`);
        } else if (att.type === "link") {
          lines.push(`  - ${att.url}`);
        }
      }
    }
  }

  return lines.join("\n");
}

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
  opts?: {
    role?: "SYSTEM" | "USER";
    attachments?: Attachment[];
    /** When provided, overrides the task ID used in prompt templates. */
    taskId?: string;
  },
): Promise<string> {
  const task = await ctx.services.tasks.getTask(ctx, taskId).catch(() => null);
  const resolvedTaskId = opts?.taskId ?? taskId;
  const agentId = task?.agentId ?? agentLaneCtx.agent.id;

  const { agent, profile, displayName, timezone, skillSummary } = agentLaneCtx;
  const isInitialDelegation = (opts?.role ?? "SYSTEM") === "SYSTEM";
  // Cross-agent delegation: this task was created by a manager and assigned
  // to a different agent. The brief is the entire context — we must NOT
  // inherit main-lane history (the recipient's main lane is unrelated)
  // and we render the delegated-task system prompt section instead.
  const isCrossAgentDelegation = task
    ? !!task.assignerAgentId && task.assignerAgentId !== task.agentId
    : !!(opts?.role === "SYSTEM"); // reconciler-dispatched cross-agent work

  // Inject related task outputs so this task can see what sibling/child tasks produced.
  if (isInitialDelegation && task) {
    const relatedContext = await buildRelatedTaskContext(ctx, task);
    if (relatedContext) {
      await writeAgentLog(ctx, {
        agentId,
        taskId,
        role: "SYSTEM",
        content: relatedContext,
      });
    }
  }

  // Log the prompt — SYSTEM for backgrounded tasks, USER for follow-up messages
  if (prompt) {
    await writeAgentLog(ctx, {
      agentId,
      taskId,
      role: opts?.role ?? "SYSTEM",
      content: prompt,
      attachments: opts?.attachments,
    });
  }

  const taskTitle = task?.title ?? prompt.slice(0, 80);

  // Generate an execution plan for new task delegations
  let planText: string | undefined;
  if (isInitialDelegation) {
    try {
      const plan = await generatePlan(ctx, agentId, taskTitle, prompt);
      planText = formatPlan(plan);

      await writeAgentLog(ctx, {
        agentId,
        taskId,
        role: "SYSTEM",
        content: `[Execution plan]\n\n${planText}`,
      });
    } catch (err) {
      ctx.log.warn(
        { err, agentId, taskId },
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
  if (isCrossAgentDelegation && task?.assignerAgentId) {
    const assigner = await ctx.services.agents
      .getAgent(ctx, task.assignerAgentId)
      .catch(() => null);
    assignerName = assigner?.name ?? task.assignerAgentId;
  }

  let systemPrompt = renderTaskSystemPrompt(
    {
      agentId: agentLaneCtx.agentId,
      name: agent.name,
      personality: agent.personality,
      role: agent.role,
      userDisplayName: displayName,
      userAbout: profile?.about,
      taskTitle: taskTitle,
      taskId: resolvedTaskId,
      ...(isCrossAgentDelegation && task?.brief && assignerName
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
    { agentId, taskId, resolvedTaskId, systemPromptLength: systemPrompt.length },
    "Task lane system prompt: %s",
    systemPrompt,
  );

  return runLane(ctx, {
    agentId,
    taskId,
    systemPrompt,
    tools: buildTaskTools(ctx, agentLaneCtx, agentId, taskId),
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
