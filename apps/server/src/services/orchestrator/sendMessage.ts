import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { runTaskLane } from "./runTaskLane.js";
import {
  defaultTools,
  delegateTaskTool,
  recallMemoryTool,
  saveMemoryTool,
} from "./tools.js";
import { writeAgentLog } from "./writeAgentLog.js";

export async function sendMessage(
  ctx: ServiceContext,
  agentId: string,
  content: string,
  taskId?: string | null,
) {
  // Write the user message
  const entry = await writeAgentLog(ctx, {
    agentId,
    taskId: taskId ?? null,
    role: "USER",
    content,
  });

  // Fire-and-forget the agent turn
  if (taskId) {
    runTaskLane(ctx, taskId, content, { skipLog: true }).catch((err) =>
      console.error("runTaskLane failed:", err),
    );
  } else {
    runMainLaneAgent(ctx, agentId, content).catch((err) =>
      console.error("runMainLane agent turn failed:", err),
    );
  }

  return {
    id: entry.id,
    agentId,
    taskId: taskId ?? null,
    role: "USER" as const,
    content,
    createdAt: entry.createdAt,
  };
}

/**
 * Runs the agent turn on the main lane.
 * The user message is already written by sendMessage, so we just
 * build history and call runAgentTurn directly.
 */
async function runMainLaneAgent(
  ctx: ServiceContext,
  agentId: string,
  userMessage: string,
) {
  const [agent, profile] = await Promise.all([
    ctx.services.agents.getAgent(ctx, agentId),
    ctx.services.profile.getProfile(ctx, "default"),
  ]);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  // Build conversation history with compaction support
  const { messages, totalLogCount } = await buildContextMessages(ctx, {
    agentId,
    taskId: null,
  });

  // Ensure the user message is included (DDB eventual consistency may miss it)
  if (
    messages.length === 0 ||
    messages[messages.length - 1].content !== userMessage
  ) {
    messages.push({ role: "user", content: userMessage });
  }

  // Recall recent journals and semantically relevant older memories
  const memories = await ctx.services.memory
    .recallMemories(ctx, agentId, userMessage)
    .catch((err) => {
      console.error("memory recall failed:", err);
      return { recent: [], relevant: [] };
    });

  let memoryContext: string | undefined;
  if (memories.recent.length > 0 || memories.relevant.length > 0) {
    const lines: string[] = ["## Long-term Memory"];
    if (memories.recent.length > 0) {
      lines.push("### Recent journals");
      for (const m of memories.recent) {
        lines.push(`[${m.date}]:\n${m.content}`);
      }
    }
    if (memories.relevant.length > 0) {
      lines.push("");
      lines.push("### Relevant past memories");
      for (const m of memories.relevant) {
        lines.push(`[${m.date}]:\n${m.content}`);
      }
    }
    lines.push("");
    lines.push(
      "You can save new memories using the saveMemory tool. Entries are appended to today's journal.",
    );
    memoryContext = lines.join("\n");
  }

  await runAgentTurn(ctx, {
    agentId,
    taskId: null,
    systemPrompt: renderPrompt("system", {
      name: agent.name,
      soul: agent.soul,
      userDisplayName: profile?.displayName ?? "the user",
      userAbout: profile?.about,
    }),
    timezone: profile?.timezone ?? undefined,
    memoryContext,
    messages,
    tools: {
      ...defaultTools,
      delegateTask: delegateTaskTool(ctx, agentId),
      saveMemory: saveMemoryTool(ctx, agentId),
      recallMemory: recallMemoryTool(ctx, agentId),
    },
  });

  // Fire-and-forget compaction
  maybeCompact(ctx, { agentId, taskId: null, messages, totalLogCount }).catch(
    (err) => console.error("compaction failed:", err),
  );
}
