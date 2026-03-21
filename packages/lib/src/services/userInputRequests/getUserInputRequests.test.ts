import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getUserInputRequests } from "./getUserInputRequests.js";

describe("getUserInputRequests", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns all user input requests", async () => {
    const requests = [
      { id: "req-1", title: "First" },
      { id: "req-2", title: "Second" },
    ];

    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: requests }),
        }),
      }),
    } as any);

    const result = await getUserInputRequests(ctx);

    expect(result).toEqual(requests);
  });

  it("returns empty array when no user input requests exist", async () => {
    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: [] }),
        }),
      }),
    } as any);

    const result = await getUserInputRequests(ctx);

    expect(result).toEqual([]);
  });

  it("returns empty array when Items is undefined", async () => {
    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: undefined }),
        }),
      }),
    } as any);

    const result = await getUserInputRequests(ctx);

    expect(result).toEqual([]);
  });
});
