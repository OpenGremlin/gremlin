import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { updateAgent } from "./updateAgent.js";

describe("updateAgent", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockSend: ReturnType<typeof vi.fn>;
  let mockItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();

    mockSend = vi.fn();
    const mockOptions = vi.fn().mockReturnValue({ send: mockSend });
    mockItem = vi
      .fn()
      .mockReturnValue({ options: mockOptions, send: mockSend });
    ctx.resources.ddb.entities.Agent.build.mockReturnValue({
      item: mockItem,
    } as any);
  });

  it("returns updated attributes", async () => {
    const updated = {
      id: "agent-1",
      name: "Updated Name",
      soul: "",
      avatar: "default",
      portraitId: "default",
    };
    mockSend.mockResolvedValue({ Attributes: updated });

    const result = await updateAgent(ctx, "agent-1", { name: "Updated Name" });

    expect(result).toEqual(updated);
  });

  it("publishes to pubsub", async () => {
    const updated = {
      id: "agent-1",
      name: "Updated",
      soul: "",
      avatar: "default",
      portraitId: "default",
    };
    mockSend.mockResolvedValue({ Attributes: updated });

    await updateAgent(ctx, "agent-1", { name: "Updated" });

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "agentUpdated:agent-1",
      updated,
    );
  });

  it("throws when Attributes is undefined", async () => {
    mockSend.mockResolvedValue({ Attributes: undefined });

    await expect(updateAgent(ctx, "agent-1", { name: "X" })).rejects.toThrow(
      "Agent agent-1 not found",
    );
  });

  it("only includes non-null fields in update", async () => {
    const updated = {
      id: "agent-1",
      name: "Test",
      soul: "",
      avatar: "default",
      portraitId: "default",
    };
    mockSend.mockResolvedValue({ Attributes: updated });

    await updateAgent(ctx, "agent-1", {
      name: "Test",
      soul: null,
      avatar: null,
    });

    expect(mockItem).toHaveBeenCalledWith({ id: "agent-1", name: "Test" });
  });
});
