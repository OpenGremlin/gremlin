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
      randomUUID: vi.fn().mockReturnValue("test-uuid"),
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));

    mockDocSend = vi.fn().mockResolvedValue({});
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
  });

  it("returns a task with generated id and timestamps", async () => {
    const result = await createTask(ctx, {
      agentId: "agent-1",
      title: "My Task",
    });

    expect(result).toEqual({
      id: "test-uuid",
      agentId: "agent-1",
      title: "My Task",
      message: null,
      createdAt: "2026-01-15T12:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z",
      originJobId: null,
      status: "open",
      issueType: "task",
    });
  });

  it("sends PutCommand to document client with correct table and keys", async () => {
    await createTask(ctx, { agentId: "agent-1", title: "My Task" });

    expect(mockDocSend).toHaveBeenCalledOnce();
    const command = mockDocSend.mock.calls[0][0];
    expect(command.input).toEqual({
      TableName: "test-table",
      Item: expect.objectContaining({
        id: "test-uuid",
        _et: "Task",
        pk: "TASK",
        sk: "TASK#test-uuid",
        gsi1pk: "TASK_AGENT#agent-1",
        gsi1sk: "2026-01-15T12:00:00.000Z",
        gsi2pk: "TASK_ALL",
        gsi2sk: "2026-01-15T12:00:00.000Z#test-uuid",
        gsi4pk: "TASK_STATUS#open",
        gsi4sk: "2026-01-15T12:00:00.000Z#test-uuid",
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

  it("preserves originJobId when provided", async () => {
    const result = await createTask(ctx, {
      agentId: "agent-1",
      title: "Task with job",
      originJobId: "job-99",
    });

    expect(result.originJobId).toBe("job-99");
  });
});
