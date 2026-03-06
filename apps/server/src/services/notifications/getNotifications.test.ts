import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { ServiceContext } from "../context.js";
import { createMockContext } from "../__testing__/mockContext.js";
import { getNotifications } from "./getNotifications.js";

describe("getNotifications", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns all notifications", async () => {
    const notifications = [
      { id: "notif-1", title: "First" },
      { id: "notif-2", title: "Second" },
    ];

    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: notifications }),
        }),
      }),
    } as any);

    const result = await getNotifications(ctx);

    expect(result).toEqual(notifications);
  });

  it("returns empty array when no notifications exist", async () => {
    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: [] }),
        }),
      }),
    } as any);

    const result = await getNotifications(ctx);

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

    const result = await getNotifications(ctx);

    expect(result).toEqual([]);
  });
});
