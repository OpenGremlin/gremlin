import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../__testing__/mockContext.js";
import type { ServiceContext } from "../context.js";
import { getAgents } from "./getAgents.js";

describe("getAgents", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("returns array of agents", async () => {
    const agents = [
      {
        id: "agent-1",
        name: "Agent One",
        personality: "",
        avatar: "default",
        portraitId: "default",
      },
      {
        id: "agent-2",
        name: "Agent Two",
        personality: "",
        avatar: "default",
        portraitId: "default",
      },
    ];

    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: agents }),
        }),
      }),
    } as any);

    const result = await getAgents(ctx);

    expect(result).toEqual(agents);
  });

  it("sorts by lastLogAt desc, with never-logged agents last (by id)", async () => {
    const agents = [
      { id: "agent-a", lastLogAt: undefined },
      { id: "agent-b", lastLogAt: "2026-04-18T10:00:00.000Z" },
      { id: "agent-c", lastLogAt: "2026-04-18T12:00:00.000Z" },
      { id: "agent-z", lastLogAt: undefined },
    ];

    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: agents }),
        }),
      }),
    } as any);

    const result = await getAgents(ctx);

    expect(result.map((a) => a.id)).toEqual([
      "agent-c",
      "agent-b",
      "agent-a",
      "agent-z",
    ]);
  });

  it("returns empty array when Items is undefined", async () => {
    ctx.resources.ddb.table.build.mockReturnValue({
      entities: vi.fn().mockReturnValue({
        query: vi.fn().mockReturnValue({
          send: vi.fn().mockResolvedValue({ Items: undefined }),
        }),
      }),
    } as any);

    const result = await getAgents(ctx);

    expect(result).toEqual([]);
  });
});
