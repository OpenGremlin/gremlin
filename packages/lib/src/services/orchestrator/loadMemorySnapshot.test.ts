import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { createMockContext } from "../__testing__/mockContext.js";
import { loadMemorySnapshot, SNAPSHOT_TTL_MS } from "./loadMemorySnapshot.js";

vi.mock("../agentLogs/getChatLane.js", () => ({
  getChatLane: vi.fn(),
}));

const { getChatLane } = await import("../agentLogs/getChatLane.js");

describe("loadMemorySnapshot", () => {
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    ctx.services.memory.recallMemories.mockResolvedValue({
      recent: [{ date: "2026-04-22", content: "journal" }],
      relevant: [],
    });
    ctx.services.memory.getCoreMemories.mockResolvedValue([]);
  });

  it("reuses a fresh snapshot without refetching memory", async () => {
    (getChatLane as Mock).mockResolvedValue({
      id: "agent-1:main",
      agentId: "agent-1",
      lane: "main",
      memorySnapshot: "cached block",
      memorySnapshotAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const result = await loadMemorySnapshot(ctx, "agent-1", null);

    expect(result).toBe("cached block");
    expect(ctx.services.memory.recallMemories).not.toHaveBeenCalled();
    expect(ctx.services.memory.getCoreMemories).not.toHaveBeenCalled();
  });

  it("rebuilds when the snapshot is older than the TTL", async () => {
    (getChatLane as Mock).mockResolvedValue({
      id: "agent-1:main",
      agentId: "agent-1",
      lane: "main",
      memorySnapshot: "stale block",
      memorySnapshotAt: new Date(
        Date.now() - (SNAPSHOT_TTL_MS + 1_000),
      ).toISOString(),
    });

    const result = await loadMemorySnapshot(ctx, "agent-1", null);

    expect(result).not.toBe("stale block");
    expect(result).toContain("journal");
    expect(ctx.services.memory.recallMemories).toHaveBeenCalledWith(
      ctx,
      "agent-1",
      "",
    );
  });

  it("builds and returns a fresh snapshot when no prior lane exists", async () => {
    (getChatLane as Mock).mockResolvedValue(null);

    const result = await loadMemorySnapshot(ctx, "agent-1", "task-42");

    expect(result).toContain("journal");
    expect(getChatLane).toHaveBeenCalledWith(ctx, "agent-1", "task:task-42");
  });

  it("returns undefined when there is no memory to render", async () => {
    (getChatLane as Mock).mockResolvedValue(null);
    ctx.services.memory.recallMemories.mockResolvedValue({
      recent: [],
      relevant: [],
    });
    ctx.services.memory.getCoreMemories.mockResolvedValue([]);

    const result = await loadMemorySnapshot(ctx, "agent-1", null);

    expect(result).toBeUndefined();
  });
});
