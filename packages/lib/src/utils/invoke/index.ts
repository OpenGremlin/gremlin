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
  buildTaskLaneContext,
  type TaskLaneContext,
} from "../../services/orchestrator/buildTaskLaneContext.js";

export interface InvokeContext extends TaskLaneContext {
  ctx: ServiceContext;
  taskId: string;
  memoryContext: string | undefined;
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

const [laneCtx, memories, coreMemories] = await Promise.all([
  buildTaskLaneContext(ctx, agentId, taskId, "(test task)"),
  services.memory.recallMemories(ctx, agentId, "(test task)").catch((err) => {
    console.error("Memory recall failed:", err);
    return { recent: [], relevant: [] };
  }),
  services.memory.getCoreMemories(ctx, agentId).catch((err) => {
    console.error("Core memory fetch failed:", err);
    return [];
  }),
]);

const memoryContext = buildMemoryContext({
  ...memories,
  core: coreMemories,
});

// ---------------------------------------------------------------------------
// Load and run the script
// ---------------------------------------------------------------------------
const invokeCtx: InvokeContext = {
  ...laneCtx,
  ctx,
  taskId,
  memoryContext,
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
