import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { getAgent } from "./getAgent.js";

describe("getAgent", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns item when found", async () => {
    const agent = {
      id: "agent-1",
      name: "Test Agent",
      soul: "test soul",
      avatar: "default",
      portraitId: "default",
    };

    const mockSend = vi.fn().mockResolvedValue({ Item: agent });
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.Agent.build.mockReturnValue({
      key: mockKey,
    } as any);

    const result = await getAgent(ctx, "agent-1");

    expect(result).toEqual(agent);
    expect(mockKey).toHaveBeenCalledWith({ id: "agent-1" });
  });

  it("returns null when not found", async () => {
    const mockSend = vi.fn().mockResolvedValue({ Item: undefined });
    const mockKey = vi.fn().mockReturnValue({ send: mockSend });
    ctx.resources.ddb.entities.Agent.build.mockReturnValue({
      key: mockKey,
    } as any);

    const result = await getAgent(ctx, "nonexistent");

    expect(result).toBeNull();
  });
});
