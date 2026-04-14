import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import * as depResource from "../../resources/ddb/taskDependency.js";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import {
  addTaskDep,
  getBlockedTasks,
  getReadyWork,
  getTaskDepTree,
  removeTaskDep,
} from "./taskDeps.js";

vi.mock("../../resources/ddb/taskDependency.js", () => ({
  addDependency: vi.fn(),
  removeDependency: vi.fn(),
  getDependencies: vi.fn(),
  getDependents: vi.fn(),
}));

const NOW = "2026-01-15T12:00:00.000Z";

const makeTask = (id: string, overrides = {}) => ({
  id,
  agentId: "agent-1",
  title: `Task ${id}`,
  message: null,
  status: "open",
  issueType: "task",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  originJobId: null,
  ...overrides,
});

const makeDep = (taskId: string, dependsOnId: string) => ({
  taskId,
  dependsOnId,
  depType: "blocks",
  createdAt: NOW,
  createdBy: "test",
});

describe("taskDeps", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  // ── addTaskDep ────────────────────────────────────────────────

  describe("addTaskDep", () => {
    it("rejects self-dependency", async () => {
      await expect(addTaskDep(ctx, "t-1", "t-1")).rejects.toThrow(
        "cannot depend on itself",
      );
    });

    it("detects direct cycle (A→B, then B→A)", async () => {
      // dependsOnId ("t-2") already depends on taskId ("t-1")
      vi.mocked(depResource.getDependencies).mockResolvedValueOnce([
        makeDep("t-2", "t-1"),
      ]);

      await expect(addTaskDep(ctx, "t-1", "t-2")).rejects.toThrow("cycle");
    });

    it("detects transitive cycle (A→B→C, then C→A)", async () => {
      // Check deps of "t-3" → finds "t-2"
      vi.mocked(depResource.getDependencies)
        .mockResolvedValueOnce([makeDep("t-3", "t-2")])
        // Check deps of "t-2" → finds "t-1"
        .mockResolvedValueOnce([makeDep("t-2", "t-1")]);

      await expect(addTaskDep(ctx, "t-1", "t-3")).rejects.toThrow("cycle");
    });

    it("adds dependency when no cycle exists", async () => {
      vi.mocked(depResource.getDependencies).mockResolvedValueOnce([]);
      vi.mocked(depResource.addDependency).mockResolvedValueOnce(
        makeDep("t-1", "t-2"),
      );
      ctx.services.tasks.getTask.mockResolvedValue(makeTask("t-1") as any);

      const result = await addTaskDep(ctx, "t-1", "t-2");

      expect(result.taskId).toBe("t-1");
      expect(result.dependsOnId).toBe("t-2");
      expect(depResource.addDependency).toHaveBeenCalledOnce();
    });

    it("publishes taskUpdated after adding dep", async () => {
      vi.mocked(depResource.getDependencies).mockResolvedValueOnce([]);
      vi.mocked(depResource.addDependency).mockResolvedValueOnce(
        makeDep("t-1", "t-2"),
      );
      ctx.services.tasks.getTask.mockResolvedValue(makeTask("t-1") as any);

      await addTaskDep(ctx, "t-1", "t-2");

      expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
        "taskUpdated:t-1",
        expect.objectContaining({ id: "t-1" }),
      );
    });
  });

  // ── removeTaskDep ─────────────────────────────────────────────

  describe("removeTaskDep", () => {
    it("removes the dependency and publishes update", async () => {
      vi.mocked(depResource.removeDependency).mockResolvedValue(undefined);
      ctx.services.tasks.getTask.mockResolvedValue(makeTask("t-1") as any);

      await removeTaskDep(ctx, "t-1", "t-2");

      expect(depResource.removeDependency).toHaveBeenCalledWith(
        expect.anything(),
        { taskId: "t-1", dependsOnId: "t-2" },
      );
      expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
        "taskUpdated:t-1",
        expect.anything(),
      );
    });
  });

  // ── getTaskDepTree ────────────────────────────────────────────

  describe("getTaskDepTree", () => {
    it("returns empty array when no dependencies", async () => {
      vi.mocked(depResource.getDependencies).mockResolvedValue([]);

      const result = await getTaskDepTree(ctx, "t-1");

      expect(result).toEqual([]);
    });

    it("returns transitive dependencies with depth", async () => {
      // t-1 depends on t-2, t-2 depends on t-3
      vi.mocked(depResource.getDependencies)
        .mockResolvedValueOnce([makeDep("t-1", "t-2")]) // direct deps of t-1
        .mockResolvedValueOnce([makeDep("t-2", "t-3")]) // deps of t-2
        .mockResolvedValueOnce([]); // deps of t-3

      ctx.services.tasks.getTask
        .mockResolvedValueOnce(makeTask("t-2") as any)
        .mockResolvedValueOnce(makeTask("t-3") as any);

      const result = await getTaskDepTree(ctx, "t-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ task: expect.objectContaining({ id: "t-2" }), depth: 1 });
      expect(result[1]).toEqual({ task: expect.objectContaining({ id: "t-3" }), depth: 2 });
    });

    it("handles diamond dependencies without duplication", async () => {
      // t-1 depends on t-2 and t-3; both t-2 and t-3 depend on t-4
      vi.mocked(depResource.getDependencies)
        .mockResolvedValueOnce([makeDep("t-1", "t-2"), makeDep("t-1", "t-3")])
        .mockResolvedValueOnce([makeDep("t-2", "t-4")])
        .mockResolvedValueOnce([makeDep("t-3", "t-4")])
        .mockResolvedValueOnce([]); // t-4 has no deps

      ctx.services.tasks.getTask
        .mockResolvedValueOnce(makeTask("t-2") as any)
        .mockResolvedValueOnce(makeTask("t-3") as any)
        .mockResolvedValueOnce(makeTask("t-4") as any);

      const result = await getTaskDepTree(ctx, "t-1");

      const ids = result.map((n) => n.task.id);
      expect(ids).toContain("t-2");
      expect(ids).toContain("t-3");
      expect(ids).toContain("t-4");
      // t-4 should appear only once despite diamond
      expect(ids.filter((id) => id === "t-4")).toHaveLength(1);
    });
  });

  // ── getBlockedTasks ───────────────────────────────────────────

  describe("getBlockedTasks", () => {
    it("returns tasks with unclosed blockers", async () => {
      const t1 = makeTask("t-1");
      const t2 = makeTask("t-2");
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1, t2] as any) // open
        .mockResolvedValueOnce([]) // in_progress
        .mockResolvedValueOnce([]); // blocked

      // t-1 has a dep on t-3 (which is open)
      vi.mocked(depResource.getDependencies)
        .mockResolvedValueOnce([makeDep("t-1", "t-3")])
        .mockResolvedValueOnce([]); // t-2 has no deps

      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask("t-3", { status: "open" }) as any,
      );

      const result = await getBlockedTasks(ctx);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t-1");
    });

    it("excludes tasks whose blockers are all closed", async () => {
      const t1 = makeTask("t-1");
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1] as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      vi.mocked(depResource.getDependencies).mockResolvedValueOnce([
        makeDep("t-1", "t-2"),
      ]);

      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask("t-2", { status: "closed" }) as any,
      );

      const result = await getBlockedTasks(ctx);

      expect(result).toHaveLength(0);
    });
  });

  // ── getReadyWork ──────────────────────────────────────────────

  describe("getReadyWork", () => {
    it("returns open tasks with no blockers", async () => {
      const t1 = makeTask("t-1");
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1] as any) // open
        .mockResolvedValueOnce([]); // in_progress

      vi.mocked(depResource.getDependencies).mockResolvedValueOnce([]);

      const result = await getReadyWork(ctx);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t-1");
    });

    it("excludes tasks with unclosed blockers", async () => {
      const t1 = makeTask("t-1");
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1] as any)
        .mockResolvedValueOnce([]);

      vi.mocked(depResource.getDependencies).mockResolvedValueOnce([
        makeDep("t-1", "t-2"),
      ]);
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask("t-2", { status: "open" }) as any,
      );

      const result = await getReadyWork(ctx);

      expect(result).toHaveLength(0);
    });

    it("includes tasks whose blockers are all closed", async () => {
      const t1 = makeTask("t-1");
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1] as any)
        .mockResolvedValueOnce([]);

      vi.mocked(depResource.getDependencies).mockResolvedValueOnce([
        makeDep("t-1", "t-2"),
      ]);
      ctx.services.tasks.getTask.mockResolvedValue(
        makeTask("t-2", { status: "closed" }) as any,
      );

      const result = await getReadyWork(ctx);

      expect(result).toHaveLength(1);
    });

    it("excludes deferred tasks", async () => {
      const t1 = makeTask("t-1", { deferUntil: "2099-01-01T00:00:00.000Z" });
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1] as any)
        .mockResolvedValueOnce([]);

      const result = await getReadyWork(ctx);

      expect(result).toHaveLength(0);
    });

    it("includes tasks past their deferUntil", async () => {
      const t1 = makeTask("t-1", { deferUntil: "2020-01-01T00:00:00.000Z" });
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1] as any)
        .mockResolvedValueOnce([]);

      vi.mocked(depResource.getDependencies).mockResolvedValueOnce([]);

      const result = await getReadyWork(ctx);

      expect(result).toHaveLength(1);
    });

    it("filters by priority", async () => {
      const t1 = makeTask("t-1", { priority: 0 });
      const t2 = makeTask("t-2", { priority: 3 });
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1, t2] as any)
        .mockResolvedValueOnce([]);

      vi.mocked(depResource.getDependencies)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await getReadyWork(ctx, { priority: 0 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t-1");
    });

    it("excludes closed tasks", async () => {
      const t1 = makeTask("t-1", { status: "closed" });
      ctx.services.tasks.getTasksByStatus
        .mockResolvedValueOnce([t1] as any) // "open" query returns closed task (edge case)
        .mockResolvedValueOnce([]);

      const result = await getReadyWork(ctx);

      expect(result).toHaveLength(0);
    });
  });
});
