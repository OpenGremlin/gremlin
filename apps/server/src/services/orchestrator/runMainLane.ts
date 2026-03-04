import type { ServiceContext } from "../context.js";
import { renderPrompt } from "../prompts/index.js";
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
 * The main lane is always free — this never blocks on tasks.
 */
export async function runMainLane(
  ctx: ServiceContext,
  agentId: string,
  userMessage: string,
): Promise<string> {
  const [agent, profile] = await Promise.all([
    ctx.services.agents.getAgent(ctx, agentId),
    ctx.services.profile.getProfile(ctx, "default"),
  ]);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  // Log the user message
  await writeAgentLog(ctx, {
    agentId,
    taskId: null,
    role: "USER",
    content: userMessage,
  });

  // Build conversation history with compaction support
  const { messages, totalLogCount } = await buildContextMessages(ctx, {
    agentId,
    taskId: null,
  });

  // Recall recent journals and semantically relevant older memories
  const memories = await ctx.services.memory
    .recallMemories(ctx, agentId, userMessage)
    .catch((err) => {
      console.error("memory recall failed:", err);
      return { recent: [], relevant: [] };
    });

  // Build memory context string
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
  maybeCompact(ctx, { agentId, taskId: null, messages, totalLogCount }).catch(
    (err) => console.error("compaction failed:", err),
  );

  return response;
}
