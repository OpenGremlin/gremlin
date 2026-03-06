import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { retireAgent } from "./retireAgent.js";

describe("retireAgent", () => {
  let ctx: DeepMockProxy<ServiceContext>;
  let mockSend: ReturnType<typeof vi.fn>;
  let mockItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = createMockContext();

    mockSend = vi.fn();
    const mockOptions = vi.fn().mockReturnValue({ send: mockSend });
    mockItem = vi.fn().mockReturnValue({ options: mockOptions, send: mockSend });
    ctx.resources.ddb.entities.Agent.build.mockReturnValue({
      item: mockItem,
    } as any);
  });

  it("sets retired: true", async () => {
    const retired = {
      id: "agent-1",
      name: "Agent",
      soul: "",
      avatar: "default",
      portraitId: "default",
      retired: true,
    };
    mockSend.mockResolvedValue({ Attributes: retired });

    await retireAgent(ctx, "agent-1");

    expect(mockItem).toHaveBeenCalledWith({ id: "agent-1", retired: true });
  });

  it("publishes to pubsub", async () => {
    const retired = {
      id: "agent-1",
      name: "Agent",
      soul: "",
      avatar: "default",
      portraitId: "default",
      retired: true,
    };
    mockSend.mockResolvedValue({ Attributes: retired });

    await retireAgent(ctx, "agent-1");

    expect(ctx.resources.pubsub.publish).toHaveBeenCalledWith(
      "agentUpdated:agent-1",
      retired,
    );
  });

  it("throws when not found", async () => {
    mockSend.mockResolvedValue({ Attributes: undefined });

    await expect(retireAgent(ctx, "agent-1")).rejects.toThrow(
      "Agent agent-1 not found",
    );
  });
});
