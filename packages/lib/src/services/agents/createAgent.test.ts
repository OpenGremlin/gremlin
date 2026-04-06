import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { createAgent } from "./createAgent.js";

describe("createAgent", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();

    const mockSend = vi.fn().mockResolvedValue({});
    const mockOptions = vi.fn().mockReturnValue({ send: mockSend });
    const mockItem = vi
      .fn()
      .mockReturnValue({ options: mockOptions, send: mockSend });
    ctx.resources.ddb.entities.Agent.build.mockReturnValue({
      item: mockItem,
    } as any);
  });

  it("lowercases the id", async () => {
    const result = await createAgent(ctx, { id: "MyAgent", name: "Test" });

    expect(result.id).toBe("myagent");
  });

  it("defaults personality to empty string when null", async () => {
    const result = await createAgent(ctx, {
      id: "agent",
      name: "Test",
      personality: null,
    });

    expect(result.personality).toBe("");
  });

  it("defaults personality to empty string when undefined", async () => {
    const result = await createAgent(ctx, { id: "agent", name: "Test" });

    expect(result.personality).toBe("");
  });

  it("defaults avatar to 'default'", async () => {
    const result = await createAgent(ctx, { id: "agent", name: "Test" });

    expect(result.avatar).toBe("default");
  });

  it("returns the created item", async () => {
    const result = await createAgent(ctx, {
      id: "Agent1",
      name: "My Agent",
      personality: "kind",
    });

    expect(result).toEqual({
      id: "agent1",
      name: "My Agent",
      personality: "kind",
      avatar: "default",
      portraitId: "default",
    });
  });
});
