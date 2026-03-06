import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { getNotification } from "./getNotification.js";

describe("getNotification", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns the first item when found", async () => {
    const notification = { id: "notif-1", title: "Test", createdAt: "2024-01-01T00:00:00Z" };

    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: [notification] }),
        }),
      }),
    } as any);

    const result = await getNotification(ctx, "notif-1");

    expect(result).toEqual(notification);
  });

  it("returns null when Items is empty", async () => {
    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: [] }),
        }),
      }),
    } as any);

    const result = await getNotification(ctx, "nonexistent");

    expect(result).toBeNull();
  });

  it("returns null when Items is undefined", async () => {
    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: undefined }),
        }),
      }),
    } as any);

    const result = await getNotification(ctx, "nonexistent");

    expect(result).toBeNull();
  });
});
