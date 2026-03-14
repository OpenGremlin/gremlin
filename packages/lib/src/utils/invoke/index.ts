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

import { createLogger } from "../../logger.js";
import { createResources } from "../../resources/index.js";
import type { ServiceContext } from "../../services/context.js";
import { createServices } from "../../services/index.js";
import { buildMemoryContext } from "../../services/orchestrator/buildMemoryContext.js";
import {
  checkCommandTool,
  ensureSandboxTool,
  runCommandTool,
} from "../../services/orchestrator/sandboxTools.js";
import { renderPrompt } from "../../services/prompts/index.js";
import { buildSkillSummary } from "../../services/skills/buildMcpConfig.js";
import { buildSkillTools } from "../../services/skills/buildSkillTools.js";
import {
  createDocumentTool,
  listJobsTool,
  postToMainLaneTool,
  recallMemoryTool,
  saveMemoryTool,
  scheduleJobTool,
  updateDocumentTool,
  updateJobTool,
  updateTaskMessageTool,
} from "../../services/tools/index.js";

export interface InvokeContext {
  ctx: ServiceContext;
  agentId: string;
  taskId: string;
  agent: any;
  profile: any;
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
  console.error("Usage: pnpm --filter @gremlin/lib invoke <scriptName> [agentId]");
  process.exit(1);
}

const log = createLogger("invoke");

// Stub pubsub — not needed for prompt building
const pubsub = {
  publish: () => {},
  subscribe: () => {
    throw new Error("pubsub not available in invoke");
  },
};

const resources = createResources(pubsub as any);
const services = createServices();
const ctx: ServiceContext = {
  resources,
  services,
  log,
  mediaCdnUrl: process.env.MEDIA_CDN_URL ?? "",
};

// ---------------------------------------------------------------------------
// Build full agent context
// ---------------------------------------------------------------------------
const taskId = "invoke-test";

const [agent, profile] = await Promise.all([
  services.agents.getAgent(ctx, agentId),
  services.profile.getProfile(ctx, "default"),
]);

if (!agent) {
  console.error(`Agent "${agentId}" not found`);
  process.exit(1);
}

const displayName = profile?.displayName ?? "the user";

const [skillSummary, skillToolsResult, memories, coreMemories] =
  await Promise.all([
    buildSkillSummary(ctx, agentId),
    buildSkillTools(ctx, agentId, taskId),
    services.memory
      .recallMemories(ctx, agentId, "(test task)")
      .catch((err) => {
        console.error("Memory recall failed:", err);
        return { recent: [], relevant: [] };
      }),
    services.memory.getCoreMemories(ctx, agentId).catch((err) => {
      console.error("Core memory fetch failed:", err);
      return [];
    }),
  ]);

let systemPrompt = renderPrompt("taskSystem", {
  name: agent.name,
  soul: agent.soul,
  userDisplayName: displayName,
  userAbout: profile?.about,
  taskTitle: "(test task)",
  taskId,
});

if (skillSummary.promptSection) {
  systemPrompt += "\n\n" + skillSummary.promptSection;
}

const memoryContext = buildMemoryContext({
  ...memories,
  core: coreMemories,
});

const tools: Record<string, any> = {
  updateTaskMessage: updateTaskMessageTool(ctx, taskId),
  postToMainLane: postToMainLaneTool(ctx, taskId),
  createDocument: createDocumentTool(ctx, taskId),
  updateDocument: updateDocumentTool(ctx),
  saveMemory: saveMemoryTool(ctx, agentId),
  recallMemory: recallMemoryTool(ctx, agentId),
  listJobs: listJobsTool(ctx, agentId),
  scheduleJob: scheduleJobTool(ctx, agentId),
  updateJob: updateJobTool(ctx, agentId),
  ...(agent.config?.sandbox?.enabled
    ? {
        ensureSandbox: ensureSandboxTool(ctx, agentId, taskId),
        runCommand: runCommandTool(
          ctx,
          agentId,
          taskId,
          skillToolsResult.getEnv,
        ),
        checkCommand: checkCommandTool(ctx, agentId),
      }
    : {}),
  ...skillToolsResult.tools,
};

// ---------------------------------------------------------------------------
// Load and run the script
// ---------------------------------------------------------------------------
const invokeCtx: InvokeContext = {
  ctx,
  agentId,
  taskId,
  agent,
  profile,
  systemPrompt,
  memoryContext,
  tools,
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
