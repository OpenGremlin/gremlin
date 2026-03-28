// biome-ignore-all lint: Debug-only code

/**
 * Test rig for invoking lib scripts with a full ServiceContext.
 * Loads .env from monorepo root, builds ctx + agent context, then
 * dynamically imports a script from ./scripts/ and passes the context in.
 *
 * Usage: pnpm --filter @gremlin/lib invoke <scriptName> [agentId]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../../.env") });

import type { ServiceContext } from "../../services/context.js";
import { createServiceContext } from "../../services/context.js";
import {
  type AgentLaneContext,
  buildAgentLaneContext,
  buildTaskTools,
} from "../../services/orchestrator/agentLaneContext.js";
import { buildMemoryContext } from "../../services/orchestrator/buildMemoryContext.js";
import {
  renderTaskSystemPrompt,
  resolvePromptFlags,
} from "../../services/prompts/index.js";

export interface InvokeContext extends AgentLaneContext {
  ctx: ServiceContext;
  agentId: string;
  taskId: string;
  systemPrompt: string;
  memoryContext: string | undefined;
  tools: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------
const scriptName = process.argv[2];
const agentId = process.argv[3] || "testbot";

if (!scriptName) {
  console.error(
    "Usage: pnpm --filter @gremlin/lib invoke <scriptName> [agentId]",
  );
  process.exit(1);
}

// Stub pubsub — not needed for prompt building
const pubsub = {
  publish: () => {},
  subscribe: () => {
    throw new Error("pubsub not available in invoke");
  },
};

const ctx = createServiceContext({
  pubsub: pubsub as any,
  logNamespace: "invoke",
});

// ---------------------------------------------------------------------------
// Build full agent context
// ---------------------------------------------------------------------------
const taskId = "invoke-test";

const [agentCtx, memories, coreMemories] = await Promise.all([
  buildAgentLaneContext(ctx, agentId),
  ctx.services.memory
    .recallMemories(ctx, agentId, "(test task)")
    .catch((err) => {
      console.error("Memory recall failed:", err);
      return { recent: [], relevant: [] };
    }),
  ctx.services.memory.getCoreMemories(ctx, agentId).catch((err) => {
    console.error("Core memory fetch failed:", err);
    return [];
  }),
]);

const agent = agentCtx.agent;
const flags = resolvePromptFlags(agent.config, {
  modelSupportsImages: true,
  hasSkills: !!agentCtx.skillSummary.promptSection,
});
let systemPrompt = renderTaskSystemPrompt(
  {
    name: agent.name,
    soul: agent.soul,
    userDisplayName: agentCtx.displayName,
    userAbout: agentCtx.profile?.about,
    taskTitle: "(test task)",
    taskId,
  },
  flags,
);

if (agentCtx.skillSummary.promptSection) {
  systemPrompt += "\n\n" + agentCtx.skillSummary.promptSection;
}

const memoryContext = buildMemoryContext({
  ...memories,
  core: coreMemories,
});

// ---------------------------------------------------------------------------
// Load and run the script
// ---------------------------------------------------------------------------
const invokeCtx: InvokeContext = {
  ...agentCtx,
  ctx,
  agentId,
  taskId,
  systemPrompt,
  memoryContext,
  tools: buildTaskTools(ctx, agentCtx, agentId, taskId),
};

try {
  const script = await import(`./scripts/${scriptName}.js`);
  await script.default(invokeCtx);
} catch (err: any) {
  if (err.code === "ERR_MODULE_NOT_FOUND") {
    console.error(`Script "${scriptName}" not found in invoke/scripts/`);
    process.exit(1);
  }
  throw err;
}
