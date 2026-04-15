import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { createTask } from "./createTask.js";

describe("createTask", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockDocSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();

    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("ABCDEFGH"),
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = i;
        return arr;
      }),
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));

    mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("test-table");
  });

  it("returns a task with generated id and timestamps", async () => {
    const result = await createTask(ctx, {
      agentId: "agent-1",
      title: "My Task",
    });

    expect(result).toEqual({
      id: "ABCDEFGH",
      agentId: "agent-1",
      title: "My Task",
      message: null,
      createdAt: "2026-01-15T12:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z",
      originJobId: null,
      status: "open",
    });
  });

  it("sends PutCommand to document client with correct table and keys", async () => {
    await createTask(ctx, { agentId: "agent-1", title: "My Task" });

    expect(mockDocSend).toHaveBeenCalledOnce();
    const command = mockDocSend.mock.calls[0][0];
    expect(command.input).toEqual({
      TableName: "test-table",
      Item: expect.objectContaining({
        id: "ABCDEFGH",
        _et: "Task",
        pk: "TASK#ABCDEFGH",
        sk: "TASK",
        gsi1pk: "TASK_AGENT#agent-1",
        gsi1sk: "2026-01-15T12:00:00.000Z",
        gsi2pk: "TASK_ALL",
        gsi2sk: "2026-01-15T12:00:00.000Z#ABCDEFGH",
        gsi4pk: "TASK_STATUS#open",
        gsi4sk: "2026-01-15T12:00:00.000Z#ABCDEFGH",
      }),
    });
  });

  it("defaults originJobId to null when not provided", async () => {
    const result = await createTask(ctx, {
      agentId: "agent-1",
      title: "Task without job",
    });

    expect(result.originJobId).toBeNull();
  });

  it("rejects empty agentId", async () => {
    await expect(
      createTask(ctx, { agentId: "", title: "No owner" }),
    ).rejects.toThrow("Tasks must be assigned to an agent");
  });

  it("rejects 'unassigned' agentId", async () => {
    await expect(
      createTask(ctx, { agentId: "unassigned", title: "Placeholder" }),
    ).rejects.toThrow("Tasks must be assigned to an agent");
  });

  it("stores instructions, expectedInput, and expectedOutput", async () => {
    const result = await createTask(ctx, {
      agentId: "agent-1",
      title: "Delegated work",
      instructions: "Do the thing",
      expectedInput: "A list of URLs",
      expectedOutput: "JSON report attached",
    });

    expect(result.instructions).toBe("Do the thing");
    expect(result.expectedInput).toBe("A list of URLs");
    expect(result.expectedOutput).toBe("JSON report attached");
  });

  it("rejects child when parent does not exist", async () => {
    ctx.services.tasks.getTask.mockResolvedValue(undefined);

    await expect(
      createTask(ctx, {
        agentId: "agent-1",
        title: "Orphan child",
        parentId: "missing-parent",
      }),
    ).rejects.toThrow("Parent task missing-parent not found");
  });

  it("rejects child when parent is unassigned", async () => {
    ctx.services.tasks.getTask.mockResolvedValue({
      id: "epic-1",
      agentId: "unassigned",
      title: "Unowned epic",
      message: null,
      createdAt: "2026-01-15T12:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z",
      originJobId: null,
      status: "open",
    });

    await expect(
      createTask(ctx, {
        agentId: "agent-1",
        title: "Child of unowned epic",
        parentId: "epic-1",
      }),
    ).rejects.toThrow("Cannot add children to unassigned task");
  });

  it("allows child when parent has a real agent", async () => {
    ctx.services.tasks.getTask.mockResolvedValue({
      id: "epic-1",
      agentId: "agent-manager",
      title: "Owned epic",
      message: null,
      createdAt: "2026-01-15T12:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z",
      originJobId: null,
      status: "open",
    });

    const result = await createTask(ctx, {
      agentId: "agent-1",
      title: "Child of owned epic",
      parentId: "epic-1",
    });

    expect(result.parentId).toBe("epic-1");
  });

  it("preserves originJobId when provided", async () => {
    const result = await createTask(ctx, {
      agentId: "agent-1",
      title: "Task with job",
      originJobId: "job-99",
    });

    expect(result.originJobId).toBe("job-99");
  });
});
