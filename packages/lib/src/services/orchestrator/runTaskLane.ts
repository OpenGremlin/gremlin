import type { ServiceContext } from "../context.js";
import {
  renderTaskSystemPrompt,
  resolvePromptFlags,
} from "../prompts/index.js";
import type { Attachment } from "../tasks/attachment.js";
import {
  type AgentLaneContext,
  buildTaskTools,
} from "./agentLaneContext/index.js";
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
    const [attachments, comments] = await Promise.all([
      ctx.services.tasks.getTaskAttachments(ctx, related.id).catch(() => []),
      ctx.services.tasks.getComments(ctx, related.id).catch(() => []),
    ]);
    lines.push(`• "${related.title}" (${related.status})`);
    if (attachments.length > 0) {
      for (const att of attachments) {
        if (att.type === "file") {
          lines.push(`  - ${att.path}`);
        } else if (att.type === "link") {
          lines.push(`  - ${att.url}`);
        }
      }
    }
    if (comments.length > 0) {
      for (const c of comments) {
        lines.push(`  > ${c.text}`);
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
  // SYSTEM-role prompts are background triggers (task dispatch, notifications,
  // scheduled jobs) where we inject related-task context and generate a plan.
  // USER-role prompts are follow-up chat messages where we skip both.
  const isSystemTrigger = (opts?.role ?? "SYSTEM") === "SYSTEM";

  // Inject related task outputs so this task can see what sibling/child tasks produced.
  if (isSystemTrigger && task) {
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

  const flags = resolvePromptFlags(agent.config, {
    modelSupportsImages: agentLaneCtx.modelSupportsImages,
    hasSkills: !!agentLaneCtx.skillSummary.promptSection,
  });

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
    },
    flags,
  );

  if (skillSummary.promptSection) {
    systemPrompt += `\n\n${skillSummary.promptSection}`;
  }

  ctx.log.info(
    {
      agentId,
      taskId,
      resolvedTaskId,
      systemPromptLength: systemPrompt.length,
    },
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
