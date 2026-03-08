import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDdbSend = vi.fn();
const mockSqsSend = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDBClient: class {
      send = mockDdbSend;
    },
    QueryCommand: class {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
  };
});

vi.mock("@aws-sdk/client-sqs", () => {
  return {
    SQSClient: class {
      send = mockSqsSend;
    },
    SendMessageCommand: class {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
  };
});

vi.mock("@gremlin/lib/logger.js", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

const { handler } = await import("./sweeper.js");

beforeEach(() => {
  mockDdbSend.mockReset();
  mockSqsSend.mockClear();
});

describe("sweeper", () => {
  it("returns early when no stale items", async () => {
    mockDdbSend.mockResolvedValueOnce({
      Items: [],
      LastEvaluatedKey: undefined,
    });

    const result = await handler();

    expect(result).toEqual({ statusCode: 200, stale: 0 });
    expect(mockSqsSend).not.toHaveBeenCalled();
  });

  it("re-rings doorbells for agents with stale items", async () => {
    mockDdbSend.mockResolvedValueOnce({
      Items: [{ agentId: { S: "agent-1" } }, { agentId: { S: "agent-2" } }],
      LastEvaluatedKey: undefined,
    });

    const result = await handler();

    expect(result).toEqual({ statusCode: 200, agents: 2 });
    expect(mockSqsSend).toHaveBeenCalledTimes(2);

    const bodies = mockSqsSend.mock.calls.map((call: unknown[]) =>
      JSON.parse(
        (call[0] as { input: { MessageBody: string } }).input.MessageBody,
      ),
    );
    expect(bodies).toContainEqual({ agentId: "agent-1" });
    expect(bodies).toContainEqual({ agentId: "agent-2" });
  });

  it("deduplicates agents across items", async () => {
    mockDdbSend.mockResolvedValueOnce({
      Items: [
        { agentId: { S: "agent-1" } },
        { agentId: { S: "agent-1" } },
        { agentId: { S: "agent-1" } },
      ],
      LastEvaluatedKey: undefined,
    });

    const result = await handler();

    expect(result).toEqual({ statusCode: 200, agents: 1 });
    expect(mockSqsSend).toHaveBeenCalledTimes(1);
  });

  it("paginates through multiple DDB pages", async () => {
    mockDdbSend
      .mockResolvedValueOnce({
        Items: [{ agentId: { S: "agent-1" } }],
        LastEvaluatedKey: { pk: { S: "x" } },
      })
      .mockResolvedValueOnce({
        Items: [{ agentId: { S: "agent-2" } }],
        LastEvaluatedKey: undefined,
      });

    const result = await handler();

    expect(mockDdbSend).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ statusCode: 200, agents: 2 });
    expect(mockSqsSend).toHaveBeenCalledTimes(2);
  });

  it("queries GSI2 with correct key condition", async () => {
    mockDdbSend.mockResolvedValueOnce({
      Items: [],
      LastEvaluatedKey: undefined,
    });

    await handler();

    const queryInput = mockDdbSend.mock.calls[0][0].input;
    expect(queryInput.IndexName).toBe("gsi2");
    expect(queryInput.KeyConditionExpression).toBe(
      "gsi2pk = :pk AND gsi2sk < :cutoff",
    );
    expect(queryInput.ExpressionAttributeValues[":pk"].S).toBe("INBOX_UNREAD");
    expect(queryInput.ProjectionExpression).toBe("agentId");
  });
});
