import type { ServiceContext } from "../context.js";
import { buildContextMessages, maybeCompact } from "./compaction.js";
import { runAgentTurn } from "./runAgentTurn.js";
import { renderSystemPrompt } from "../prompts/renderSystemPrompt.js";
import { defaultTools, delegateTaskTool, saveMemoryTool } from "./tools.js";
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

  // Recall relevant memories and list topics in parallel
  const [recalled, topics] = await Promise.all([
    ctx.services.memory
      .recallMemories(ctx, agentId, userMessage)
      .catch((err) => {
        console.error("memory recall failed:", err);
        return [];
      }),
    ctx.services.memory
      .listMemoryTopics(ctx, agentId)
      .catch((err) => {
        console.error("memory topic list failed:", err);
        return [];
      }),
  ]);

  // Build memory context string
  let memoryContext: string | undefined;
  if (topics.length > 0 || recalled.length > 0) {
    const lines: string[] = ["## Long-term Memory"];
    if (topics.length > 0) {
      lines.push(
        `Your memory topics: ${topics.map((t) => t.topic).join(", ")}`,
      );
    }
    if (recalled.length > 0) {
      lines.push("");
      lines.push("Relevant memories:");
      for (const m of recalled) {
        lines.push(`- [${m.topic}]: ${m.content}`);
      }
    }
    lines.push("");
    lines.push(
      "You can save new memories or append to existing topics using the saveMemory tool.",
    );
    memoryContext = lines.join("\n");
  }

  const response = await runAgentTurn(ctx, {
    agentId,
    taskId: null,
    systemPrompt: renderSystemPrompt({
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
    },
  });

  // Fire-and-forget compaction
  maybeCompact(ctx, { agentId, taskId: null, messages, totalLogCount }).catch(
    (err) => console.error("compaction failed:", err),
  );

  return response;
}
