import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestContext } from "../../../__testing__/buildTestContext.js";
import { invokeResolver } from "../../../__testing__/invokeResolver.js";
import { agentResolvers } from "./resolvers.js";

describe("Agent resolvers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("agents delegates to agents.getAgents", async () => {
    const list = [{ id: "a-1" }, { id: "a-2" }];
    const ctx = buildTestContext();
    ctx.services.agents.getAgents = vi.fn().mockResolvedValue(list);

    const result = await invokeResolver(agentResolvers.Query.agents, { ctx });

    expect(result).toBe(list);
    expect(ctx.services.agents.getAgents).toHaveBeenCalledWith(ctx);
  });

  it("agent delegates id to agents.getAgent", async () => {
    const agent = { id: "a-1", name: "Bot" };
    const ctx = buildTestContext();
    ctx.services.agents.getAgent = vi.fn().mockResolvedValue(agent);

    const result = await invokeResolver(agentResolvers.Query.agent, {
      args: { id: "a-1" },
      ctx,
    });

    expect(result).toBe(agent);
    expect(ctx.services.agents.getAgent).toHaveBeenCalledWith(ctx, "a-1");
  });

  it("createAgent forwards input to agents.createAgent", async () => {
    const created = { id: "a-new", name: "New" };
    const ctx = buildTestContext();
    ctx.services.agents.createAgent = vi.fn().mockResolvedValue(created);
    const input = { id: "a-new", name: "New" };

    const result = await invokeResolver(agentResolvers.Mutation.createAgent, {
      args: { input },
      ctx,
    });

    expect(result).toBe(created);
    expect(ctx.services.agents.createAgent).toHaveBeenCalledWith(ctx, input);
  });

  it("updateAgent forwards id + input to agents.updateAgent", async () => {
    const updated = { id: "a-1", name: "Updated" };
    const ctx = buildTestContext();
    ctx.services.agents.updateAgent = vi.fn().mockResolvedValue(updated);
    const input = { name: "Updated" };

    const result = await invokeResolver(agentResolvers.Mutation.updateAgent, {
      args: { id: "a-1", input },
      ctx,
    });

    expect(result).toBe(updated);
    expect(ctx.services.agents.updateAgent).toHaveBeenCalledWith(
      ctx,
      "a-1",
      input,
    );
  });

  it("retireAgent forwards id", async () => {
    const retired = { id: "a-1", retired: true };
    const ctx = buildTestContext();
    ctx.services.agents.retireAgent = vi.fn().mockResolvedValue(retired);

    const result = await invokeResolver(agentResolvers.Mutation.retireAgent, {
      args: { id: "a-1" },
      ctx,
    });

    expect(result).toBe(retired);
    expect(ctx.services.agents.retireAgent).toHaveBeenCalledWith(ctx, "a-1");
  });

  it("unretireAgent forwards id", async () => {
    const unretired = { id: "a-1", retired: false };
    const ctx = buildTestContext();
    ctx.services.agents.unretireAgent = vi.fn().mockResolvedValue(unretired);

    const result = await invokeResolver(agentResolvers.Mutation.unretireAgent, {
      args: { id: "a-1" },
      ctx,
    });

    expect(result).toBe(unretired);
    expect(ctx.services.agents.unretireAgent).toHaveBeenCalledWith(ctx, "a-1");
  });

  it("Agent.retired defaults to false when absent", async () => {
    const ctx = buildTestContext();
    const resolve = (parent: unknown) =>
      invokeResolver(agentResolvers.Agent.retired, {
        parent: parent as any,
        ctx,
      });

    expect(await resolve({ retired: undefined })).toBe(false);
    expect(await resolve({ retired: true })).toBe(true);
  });

  it("Agent.voiceEnabled reads config.speech.enabled", async () => {
    const ctx = buildTestContext();
    const resolve = (parent: unknown) =>
      invokeResolver(agentResolvers.Agent.voiceEnabled, {
        parent: parent as any,
        ctx,
      });

    expect(await resolve({ config: { speech: { enabled: true } } })).toBe(true);
    expect(await resolve({ config: {} })).toBe(false);
    expect(await resolve({})).toBe(false);
  });
});
