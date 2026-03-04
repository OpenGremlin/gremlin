import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
import { buildMemoryContext } from "./buildMemoryContext.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import {
  defaultTools,
  delegateTaskTool,
  recallMemoryTool,
  saveMemoryTool,
} from "./tools.js";
import { writeAgentLog } from "./writeAgentLog.js";

/**
 * Run an agent turn on the main lane (user conversation thread).
 *
 * @param recallHint - Text used for memory recall. When called from the
 *   inbox consumer the user message is already in the log, so only the
 *   hint is needed (no log write). When a userMessage needs to be logged,
 *   pass `opts.userMessage`.
 */
export async function runMainLane(
  ctx: ServiceContext,
  agentId: string,
  recallHint?: string,
  opts?: { userMessage?: string },
): Promise<string> {
  const [agent, profile] = await Promise.all([
    ctx.services.agents.getAgent(ctx, agentId),
    ctx.services.profile.getProfile(ctx, "default"),
  ]);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  // Only write the user message when explicitly provided (legacy path).
  // The inbox consumer writes messages before enqueueing, so it skips this.
  if (opts?.userMessage) {
    await writeAgentLog(ctx, {
      agentId,
      taskId: null,
      role: "USER",
      content: opts.userMessage,
    });
  }

  // Build conversation history with compaction support
  const { messages, postCompactionCount } = await buildContextMessages(ctx, {
    agentId,
    taskId: null,
  });

  // Recall recent journals and semantically relevant older memories
  const memories = await ctx.services.memory
    .recallMemories(ctx, agentId, recallHint ?? "")
    .catch((err) => {
      ctx.log.error({ err, component: "memory" }, "Memory recall failed");
      return { recent: [], relevant: [] };
    });

  const memoryContext = buildMemoryContext(memories);

  const response = await runAgentTurn(ctx, {
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
  maybeCompact(ctx, {
    agentId,
    taskId: null,
    messages,
    postCompactionCount,
  }).catch((err) =>
    ctx.log.error({ err, component: "compaction" }, "Compaction failed"),
  );

  return response;
}
