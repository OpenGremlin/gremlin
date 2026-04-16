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

    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("att-uuid-1"),
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));

    mockDocSend = vi.fn();
    ctx.resources.ddb.chatTable.getDocumentClient.mockReturnValue({
      send: mockDocSend,
    } as any);
    ctx.resources.ddb.chatTable.getName.mockReturnValue("test-table");
  });

  it("writes a file attachment with UUID pk, GSI1 for task, GSI2 for path", async () => {
    mockDocSend
      .mockResolvedValueOnce({ Items: [] }) // dedup query
      .mockResolvedValueOnce({}) // PutCommand
      .mockResolvedValueOnce({ Attributes: undefined }); // UpdateCommand (touch task)

    await addTaskAttachment(ctx, "task-1", {
      type: "file",
      path: "/output/report.pdf",
    });

    expect(mockDocSend).toHaveBeenCalledTimes(3);

    // PutCommand for standalone attachment item
    const putCommand = mockDocSend.mock.calls[1][0];
    expect(putCommand.input.Item).toMatchObject({
      _et: "TaskAttachment",
      pk: "ATTACHMENT#att-uuid-1",
      sk: "ATTACHMENT",
      id: "att-uuid-1",
      taskId: "task-1",
      dedupKey: "file:/output/report.pdf",
      type: "file",
      path: "/output/report.pdf",
      gsi1pk: "TASK_ATTACHMENT#task-1",
      gsi1sk: "2026-01-15T12:00:00.000Z",
      gsi2pk: "ATTACHMENT_FILE",
      gsi2sk: "/output/report.pdf",
    });
  });

  it("writes a link attachment with GSI1 but no GSI2", async () => {
    mockDocSend
      .mockResolvedValueOnce({ Items: [] }) // dedup query
      .mockResolvedValueOnce({}) // PutCommand
      .mockResolvedValueOnce({ Attributes: undefined }); // UpdateCommand

    await addTaskAttachment(ctx, "task-1", {
      type: "link",
      url: "https://example.com",
      title: "Example",
    });

    const putCommand = mockDocSend.mock.calls[1][0];
    expect(putCommand.input.Item).toMatchObject({
      type: "link",
      url: "https://example.com",
      title: "Example",
      gsi1pk: "TASK_ATTACHMENT#task-1",
    });
    // Link attachments should NOT have GSI2 keys
    expect(putCommand.input.Item.gsi2pk).toBeUndefined();
    expect(putCommand.input.Item.gsi2sk).toBeUndefined();
  });

  it("publishes to pubsub when Attributes returned", async () => {
    const updatedTask = {
      id: "task-1",
      agentId: "agent-1",
      title: "Test Task",
      updatedAt: "2026-01-15T12:00:00.000Z",
    };

    mockDocSend
      .mockResolvedValueOnce({ Items: [] }) // dedup
      .mockResolvedValueOnce({}) // PutCommand
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
      .mockResolvedValueOnce({ Items: [] }) // dedup
      .mockResolvedValueOnce({}) // PutCommand
      .mockResolvedValueOnce({ Attributes: undefined }); // UpdateCommand

    await addTaskAttachment(ctx, "task-1", {
      type: "file",
      path: "/output/report.pdf",
    });

    expect(ctx.resources.pubsub.publish).not.toHaveBeenCalled();
  });

  it("skips duplicate attachment (dedup query finds existing)", async () => {
    mockDocSend.mockResolvedValueOnce({
      Items: [{ dedupKey: "file:/output/report.pdf" }],
    });

    await addTaskAttachment(ctx, "task-1", {
      type: "file",
      path: "/output/report.pdf",
    });

    // Only the dedup query should have been sent
    expect(mockDocSend).toHaveBeenCalledTimes(1);
    expect(ctx.resources.pubsub.publish).not.toHaveBeenCalled();
  });
});
