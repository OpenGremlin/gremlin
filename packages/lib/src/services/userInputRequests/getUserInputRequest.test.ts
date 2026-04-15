import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getUserInputRequest } from "./getUserInputRequest.js";

describe("getUserInputRequest", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns the first item when found", async () => {
    const request = {
      id: "req-1",
      title: "Test",
      createdAt: "2024-01-01T00:00:00Z",
    };

    ctx.resources.ddb.chatTable.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: [request] }),
        }),
      }),
    } as any);

    const result = await getUserInputRequest(ctx, "req-1");

    expect(result).toEqual(request);
  });

  it("returns null when Items is empty", async () => {
    ctx.resources.ddb.chatTable.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: [] }),
        }),
      }),
    } as any);

    const result = await getUserInputRequest(ctx, "nonexistent");

    expect(result).toBeNull();
  });

  it("returns null when Items is undefined", async () => {
    ctx.resources.ddb.chatTable.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: undefined }),
        }),
      }),
    } as any);

    const result = await getUserInputRequest(ctx, "nonexistent");

    expect(result).toBeNull();
  });
});
