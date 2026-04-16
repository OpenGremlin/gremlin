import { beforeEach, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../../__testing__/mockContext.js";
import type { ServiceContext } from "../../context.js";
import { buildInputRequestReplyContent } from "./inputRequestReplies.js";

describe("buildInputRequestReplyContent", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("includes the original prompt + user's choice when the request exists", async () => {
    ctx.services.userInputRequests.getUserInputRequest.mockResolvedValue({
      id: "req-1",
      message: "Ship the release?",
    } as any);

    const reply = await buildInputRequestReplyContent(ctx, {
      requestId: "req-1",
      action: "Confirm",
    });

    expect(reply).toContain('Request: "Ship the release?"');
    expect(reply).toContain('User selected: "Confirm"');
  });

  it("falls back to a generic message when the request was not found", async () => {
    ctx.services.userInputRequests.getUserInputRequest.mockResolvedValue(
      null as any,
    );

    const reply = await buildInputRequestReplyContent(ctx, {
      requestId: "gone",
      action: "Cancel",
    });

    expect(reply).toBe("The user responded to a request with action: Cancel");
  });
});
