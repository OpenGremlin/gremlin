import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { addTaskAttachment } from "./addTaskAttachment.js";

describe("addTaskAttachment", () => {
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

  it("sends UpdateCommand for a file attachment", async () => {
    mockDocSend
      .mockResolvedValueOnce({ Item: undefined }) // GetCommand
      .mockResolvedValueOnce({ Attributes: undefined }); // UpdateCommand

    await addTaskAttachment(ctx, "task-1", {
      type: "file",
      path: "/output/report.pdf",
    });

    expect(mockDocSend).toHaveBeenCalledTimes(2);
    const command = mockDocSend.mock.calls[1][0];
    expect(command.input).toEqual({
      TableName: "test-table",
      Key: { pk: "TASK", sk: "TASK#task-1" },
      UpdateExpression:
        "SET attachments = list_append(if_not_exists(attachments, :empty), :item), updatedAt = :now",
      ExpressionAttributeValues: {
        ":item": [{ type: "file", path: "/output/report.pdf" }],
        ":empty": [],
        ":now": "2026-01-15T12:00:00.000Z",
      },
      ReturnValues: "ALL_NEW",
    });
  });

  it("sends UpdateCommand for a link attachment", async () => {
    mockDocSend
      .mockResolvedValueOnce({ Item: undefined }) // GetCommand
      .mockResolvedValueOnce({ Attributes: undefined }); // UpdateCommand

    await addTaskAttachment(ctx, "task-1", {
      type: "link",
      url: "https://example.com",
      title: "Example",
    });

    expect(mockDocSend).toHaveBeenCalledTimes(2);
    const command = mockDocSend.mock.calls[1][0];
    expect(command.input.ExpressionAttributeValues[":item"]).toEqual([
      { type: "link", url: "https://example.com", title: "Example" },
    ]);
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
      emoji: null,
      attachments: [{ type: "file", path: "/output/report.pdf" }],
    };

    mockDocSend
      .mockResolvedValueOnce({ Item: undefined }) // GetCommand
      .mockResolvedValueOnce({ Attributes: updatedTask }); // UpdateCommand

    await addTaskAttachment(ctx, "task-1", {
      type: "file",
      path: "/output/report.pdf",
    });

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "taskUpdated:task-1",
      updatedTask,
    );
  });

  it("does not publish when Attributes is undefined", async () => {
    mockDocSend
      .mockResolvedValueOnce({ Item: undefined }) // GetCommand
      .mockResolvedValueOnce({ Attributes: undefined }); // UpdateCommand

    await addTaskAttachment(ctx, "task-1", {
      type: "file",
      path: "/output/report.pdf",
    });

    expect(ctx.resources.pubsub.publish).not.toHaveBeenCalled();
  });

  it("skips duplicate file attachment", async () => {
    mockDocSend.mockResolvedValueOnce({
      Item: {
        attachments: [{ type: "file", path: "/output/report.pdf" }],
      },
    });

    await addTaskAttachment(ctx, "task-1", {
      type: "file",
      path: "/output/report.pdf",
    });

    // Only the GetCommand should have been sent, no UpdateCommand
    expect(mockDocSend).toHaveBeenCalledTimes(1);
    expect(ctx.resources.pubsub.publish).not.toHaveBeenCalled();
  });

  it("skips duplicate link attachment", async () => {
    mockDocSend.mockResolvedValueOnce({
      Item: {
        attachments: [
          { type: "link", url: "https://example.com", title: "Old Title" },
        ],
      },
    });

    await addTaskAttachment(ctx, "task-1", {
      type: "link",
      url: "https://example.com",
      title: "New Title",
    });

    expect(mockDocSend).toHaveBeenCalledTimes(1);
    expect(ctx.resources.pubsub.publish).not.toHaveBeenCalled();
  });

  it("allows different attachments on the same task", async () => {
    mockDocSend
      .mockResolvedValueOnce({
        Item: {
          attachments: [{ type: "file", path: "/output/a.pdf" }],
        },
      })
      .mockResolvedValueOnce({ Attributes: undefined });

    await addTaskAttachment(ctx, "task-1", {
      type: "file",
      path: "/output/b.pdf",
    });

    expect(mockDocSend).toHaveBeenCalledTimes(2);
  });
});
