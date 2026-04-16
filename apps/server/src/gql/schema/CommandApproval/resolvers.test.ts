import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestContext } from "../../../__testing__/buildTestContext.js";
import { invokeResolver } from "../../../__testing__/invokeResolver.js";
import { commandApprovalResolvers } from "./resolvers.js";

// shellGuard type is missing getPendingCommandApprovals / resolveCommandApproval
// (see resolvers.ts), so casts through `any` mirror the prod code.
describe("CommandApproval resolvers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pendingCommandApprovals delegates to shellGuard.getPendingCommandApprovals", async () => {
    const pending = [{ id: "ca-1", agentId: "a-1" }];
    const ctx = buildTestContext();
    (ctx.services.shellGuard as any).getPendingCommandApprovals = vi
      .fn()
      .mockResolvedValue(pending);

    const result = await invokeResolver(
      commandApprovalResolvers.Query.pendingCommandApprovals,
      { ctx },
    );

    expect(result).toBe(pending);
    expect(
      (ctx.services.shellGuard as any).getPendingCommandApprovals,
    ).toHaveBeenCalledWith(ctx);
  });

  it("resolveCommandApproval forwards id + decision to shellGuard", async () => {
    const returned = { id: "ca-1", status: "APPROVED" };
    const ctx = buildTestContext();
    (ctx.services.shellGuard as any).resolveCommandApproval = vi
      .fn()
      .mockResolvedValue(returned);

    const result = await invokeResolver(
      commandApprovalResolvers.Mutation.resolveCommandApproval,
      { args: { id: "ca-1", decision: "approve" }, ctx },
    );

    expect(result).toBe(returned);
    expect(
      (ctx.services.shellGuard as any).resolveCommandApproval,
    ).toHaveBeenCalledWith(ctx, "ca-1", "approve");
  });

  it("CommandApproval.agent resolves the parent's agentId via the agentLoader", async () => {
    const agent = { id: "agent-1", name: "Bob" };
    const ctx = buildTestContext();
    ctx.loaders.agentLoader.load = vi.fn().mockResolvedValue(agent);

    const result = await invokeResolver(
      commandApprovalResolvers.CommandApproval.agent,
      {
        parent: { agentId: "agent-1" },
        ctx,
      },
    );

    expect(result).toBe(agent);
    expect(ctx.loaders.agentLoader.load).toHaveBeenCalledWith("agent-1");
  });
});
