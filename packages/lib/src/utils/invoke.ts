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
import { createServices } from "../services/index.js";
import { renderPrompt } from "../services/prompts/index.js";
import { buildSkillSummary } from "../services/skills/buildMcpConfig.js";
import { buildSkillTools } from "../services/skills/buildSkillTools.js";
import type { ServiceContext } from "../services/context.js";

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

console.log("=".repeat(80));
console.log("SYSTEM PROMPT");
console.log("=".repeat(80));
console.log(systemPrompt);
console.log("=".repeat(80));
console.log("\nSkill tools:", Object.keys(skillToolsResult.tools));
console.log("Skill env keys:", Object.keys(skillToolsResult.getEnv()));
