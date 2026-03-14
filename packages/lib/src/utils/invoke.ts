// biome-ignore-all lint: Debug-only code

/**
 * Test rig for invoking lib code with a full ServiceContext.
 * Loads .env from monorepo root, builds ctx, then runs inline code.
 *
 * Usage: pnpm --filter @gremlin/lib invoke
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import { createLogger } from "../logger.js";
import { createResources } from "../resources/index.js";
import type { ServiceContext } from "../services/context.js";
import { createServices } from "../services/index.js";
import {
  checkCommandTool,
  ensureSandboxTool,
  runCommandTool,
} from "../services/orchestrator/sandboxTools.js";
import { renderPrompt } from "../services/prompts/index.js";
import { buildSkillSummary } from "../services/skills/buildMcpConfig.js";
import { buildSkillTools } from "../services/skills/buildSkillTools.js";
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
} from "../services/tools/index.js";

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
// Build the full task lane system prompt for an agent
// ---------------------------------------------------------------------------
const agentId = process.argv[2] || "testbot";
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

const [skillSummary, skillToolsResult] = await Promise.all([
  buildSkillSummary(ctx, agentId),
  buildSkillTools(ctx, agentId, taskId),
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

// Build the full tool set (mirrors runTaskLane)
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
// Print system prompt
// ---------------------------------------------------------------------------
console.log("=".repeat(80));
console.log("SYSTEM PROMPT");
console.log("=".repeat(80));
console.log(systemPrompt);

// ---------------------------------------------------------------------------
// Print available tools
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(80));
console.log("TOOLS");
console.log("=".repeat(80));

for (const [name, t] of Object.entries(tools)) {
  const desc = (t as any).description ?? "(no description)";
  const params: string[] = [];

  // Extract parameter names and optionality from Zod inputSchema
  const shape = (t as any).inputSchema?.shape;
  if (shape) {
    for (const [key, val] of Object.entries(shape)) {
      const optional = (val as any).isOptional?.() ? "?" : "";
      const paramDesc = (val as any).description;
      params.push(`${key}${optional}${paramDesc ? ` — ${paramDesc}` : ""}`);
    }
  }

  console.log(`\n  ${name}`);
  console.log(`    ${desc.split("\n")[0]}`);
  if (params.length > 0) {
    console.log(`    params: ${params.join(", ")}`);
  }
}

console.log("\n" + "=".repeat(80));
