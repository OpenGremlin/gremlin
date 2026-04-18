import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { Resources } from "../../resources/index.js";
import { ingestEvents } from "./ingestEvents.js";

describe("ingestEvents", () => {
  let resources: ReturnType<typeof mockDeep<Resources>>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resources = mockDeep<Resources>();
    mockSend = vi.fn();
    resources.ddb.table.getDocumentClient.mockReturnValue({
      send: mockSend,
    } as ReturnType<typeof resources.ddb.table.getDocumentClient>);
    resources.ddb.table.getName.mockReturnValue("test-table");
  });

  it("writes each event and counts accepted", async () => {
    mockSend.mockResolvedValue({});

    const result = await ingestEvents(resources, {
      webhookId: "wh-1",
      topic: "test:hello",
      events: [
        { id: "e1", payload: { hi: "there" } },
        { id: "e2", payload: { bye: "now" } },
      ],
    });

    expect(result).toEqual({ accepted: 2, deduped: 0 });
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("treats ConditionalCheckFailedException as deduped, not a write failure", async () => {
    // First event succeeds; second collides with a prior write.
    const conditionalErr = Object.assign(new Error("conflict"), {
      name: "ConditionalCheckFailedException",
    });
    mockSend
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(conditionalErr)
      .mockResolvedValueOnce({});

    const result = await ingestEvents(resources, {
      webhookId: "wh-1",
      topic: "test:hello",
      events: [{ id: "e1" }, { id: "e2-dup" }, { id: "e3" }],
    });

    expect(result).toEqual({ accepted: 2, deduped: 1 });
  });

  it("propagates non-conditional errors so real failures surface as 500", async () => {
    mockSend.mockRejectedValue(new Error("kaboom"));

    await expect(
      ingestEvents(resources, {
        webhookId: "wh-1",
        topic: "test:hello",
        events: [{ id: "e1" }],
      }),
    ).rejects.toThrow("kaboom");
  });

  it("encodes dedupe key as (webhookId, eventId) in pk/sk", async () => {
    mockSend.mockResolvedValue({});

    await ingestEvents(resources, {
      webhookId: "wh-42",
      topic: "test:hello",
      events: [{ id: "ev-xyz", some: "payload" }],
    });

    const command = mockSend.mock.calls[0][0];
    expect(command.input.Item).toMatchObject({
      pk: "WEBHOOK_EVENT#wh-42",
      sk: "WEBHOOK_EVENT#ev-xyz",
      gsi1pk: "WEBHOOK_EVENT_TOPIC#test:hello",
    });
    expect(command.input.ConditionExpression).toBe("attribute_not_exists(pk)");
  });
});
