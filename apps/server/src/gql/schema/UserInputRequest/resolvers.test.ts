import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestContext } from "../../../__testing__/buildTestContext.js";
import { invokeResolver } from "../../../__testing__/invokeResolver.js";
import { userInputRequestResolvers } from "./resolvers.js";

describe("UserInputRequest resolvers", () => {
  beforeEach(() => vi.clearAllMocks());
  it("userInputRequests delegates to the service", async () => {
    const pending = [{ id: "uir-1", agentId: "a-1" }];
    const ctx = buildTestContext();
    ctx.services.userInputRequests.getUserInputRequests = vi
      .fn()
      .mockResolvedValue(pending);

    const result = await invokeResolver(
      userInputRequestResolvers.Query.userInputRequests,
      { ctx },
    );

    expect(result).toBe(pending);
    expect(
      ctx.services.userInputRequests.getUserInputRequests,
    ).toHaveBeenCalledWith(ctx);
  });

  it("resolveUserInputRequest forwards id + action to the service", async () => {
    const returned = { id: "uir-1", status: "RESOLVED" };
    const ctx = buildTestContext();
    ctx.services.userInputRequests.resolveUserInputRequest = vi
      .fn()
      .mockResolvedValue(returned);

    const result = await invokeResolver(
      userInputRequestResolvers.Mutation.resolveUserInputRequest,
      { args: { id: "uir-1", action: "proceed" }, ctx },
    );

    expect(result).toBe(returned);
    expect(
      ctx.services.userInputRequests.resolveUserInputRequest,
    ).toHaveBeenCalledWith(ctx, "uir-1", "proceed");
  });

  it("dismissUserInputRequest forwards the id to the service", async () => {
    const ctx = buildTestContext();
    ctx.services.userInputRequests.dismissUserInputRequest = vi
      .fn()
      .mockResolvedValue(true);

    const result = await invokeResolver(
      userInputRequestResolvers.Mutation.dismissUserInputRequest,
      { args: { id: "uir-1" }, ctx },
    );

    expect(result).toBe(true);
    expect(
      ctx.services.userInputRequests.dismissUserInputRequest,
    ).toHaveBeenCalledWith(ctx, "uir-1");
  });

  it("UserInputRequest.agent resolves the parent's agentId via the agentLoader", async () => {
    const agent = { id: "agent-1", name: "Alice" };
    const ctx = buildTestContext();
    ctx.loaders.agentLoader.load = vi.fn().mockResolvedValue(agent);

    const result = await invokeResolver(
      userInputRequestResolvers.UserInputRequest.agent,
      // partial parent — resolver only reads agentId
      { parent: { agentId: "agent-1" } as any, ctx },
    );

    expect(result).toBe(agent);
    expect(ctx.loaders.agentLoader.load).toHaveBeenCalledWith("agent-1");
  });
});
