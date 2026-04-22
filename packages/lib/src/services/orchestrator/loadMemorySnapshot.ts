import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { chatLaneId } from "../../resources/ddb/schema/chatLane.js";
import { getChatLane } from "../agentLogs/getChatLane.js";
import type { ServiceContext } from "../context.js";
import { buildMemoryContext } from "./buildMemoryContext.js";

/**
 * Idle-cache TTL for the memory snapshot. Matches Anthropic's 5-minute
 * rolling cache TTL so a refresh only happens when the prompt cache would
 * already be cold — refreshing mid-warm-cache would bust the prefix.
 */
export const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

function laneKey(taskId: string | null): string {
  return taskId ? `task:${taskId}` : "main";
}

/**
 * Returns the memory-context block for a given lane, reusing a persisted
 * snapshot when it's younger than SNAPSHOT_TTL_MS. Model-driven semantic
 * recall of older memories is handled separately via the recallMemory tool.
 */
export async function loadMemorySnapshot(
  ctx: ServiceContext,
  agentId: string,
  taskId: string | null,
): Promise<string | undefined> {
  const lane = laneKey(taskId);

  const existing = await getChatLane(ctx, agentId, lane).catch((err) => {
    ctx.log.error(
      { err, component: "memory" },
      "Chat lane snapshot read failed; rebuilding",
    );
    return null;
  });
  if (existing?.memorySnapshot && existing.memorySnapshotAt) {
    const ageMs = Date.now() - new Date(existing.memorySnapshotAt).getTime();
    if (ageMs < SNAPSHOT_TTL_MS) {
      return existing.memorySnapshot;
    }
  }

  const snapshot = await buildFreshSnapshot(ctx, agentId);
  if (snapshot) {
    await persistSnapshot(ctx, agentId, lane, snapshot).catch((err) => {
      ctx.log.error(
        { err, component: "memory" },
        "Memory snapshot persist failed",
      );
    });
  }
  return snapshot;
}

async function buildFreshSnapshot(
  ctx: ServiceContext,
  agentId: string,
): Promise<string | undefined> {
  const [memories, coreMemories] = await Promise.all([
    ctx.services.memory.recallMemories(ctx, agentId, "").catch((err) => {
      ctx.log.error({ err, component: "memory" }, "Memory recall failed");
      return { recent: [], relevant: [] };
    }),
    ctx.services.memory.getCoreMemories(ctx, agentId).catch((err) => {
      ctx.log.error({ err, component: "memory" }, "Core memory fetch failed");
      return [];
    }),
  ]);
  return buildMemoryContext({
    recent: memories.recent,
    core: coreMemories,
  });
}

async function persistSnapshot(
  ctx: ServiceContext,
  agentId: string,
  lane: string,
  snapshot: string,
): Promise<void> {
  const id = chatLaneId(agentId, lane);
  await ctx.resources.ddb.entities.ChatLane.build(UpdateItemCommand)
    .item({
      id,
      agentId,
      lane,
      memorySnapshot: snapshot,
      memorySnapshotAt: new Date().toISOString(),
    })
    .send();
}
