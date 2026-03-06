import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { addTaskArtifact } from "./addTaskArtifact.js";

describe("addTaskArtifact", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockDocSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));

    mockDocSend = vi.fn();
    ctx.resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.table.getName.mockReturnValue("test-table");
  });

  it("sends UpdateCommand with correct parameters", async () => {
    mockDocSend.mockResolvedValue({ Attributes: undefined });

    await addTaskArtifact(ctx, "task-1", "/output/report.pdf");

    expect(mockDocSend).toHaveBeenCalledOnce();
    const command = mockDocSend.mock.calls[0][0];
    expect(command.input).toEqual({
      TableName: "test-table",
      Key: { pk: "TASK", sk: "TASK#task-1" },
      UpdateExpression:
        "SET artifacts = list_append(if_not_exists(artifacts, :empty), :doc), updatedAt = :now",
      ExpressionAttributeValues: {
        ":doc": ["/output/report.pdf"],
        ":empty": [],
        ":now": "2026-01-15T12:00:00.000Z",
      },
      ReturnValues: "ALL_NEW",
    });
  });

  it("publishes to pubsub when Attributes returned", async () => {
    const updatedTask = {
      id: "task-1",
      agentId: "agent-1",
      title: "Test Task",
      message: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z",
      completedAt: null,
      originJobId: null,
      image: null,
      artifacts: ["/output/report.pdf"],
    };

    mockDocSend.mockResolvedValue({ Attributes: updatedTask });

    await addTaskArtifact(ctx, "task-1", "/output/report.pdf");

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "taskUpdated:task-1",
      updatedTask,
    );
  });

  it("does not publish when Attributes is undefined", async () => {
    mockDocSend.mockResolvedValue({ Attributes: undefined });

    await addTaskArtifact(ctx, "task-1", "/output/report.pdf");

    expect(ctx.resources.pubsub.publish).not.toHaveBeenCalled();
  });
});
