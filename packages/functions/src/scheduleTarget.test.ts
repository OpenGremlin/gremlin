import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDdbSend = vi.fn().mockResolvedValue({});
const mockSqsSend = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDBClient: class {
      send = mockDdbSend;
    },
    PutItemCommand: class {
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

const { handler } = await import("./scheduleTarget.js");

beforeEach(() => {
  mockDdbSend.mockClear();
  mockSqsSend.mockClear();
});

describe("scheduleTarget", () => {
  it("writes an inbox item to DDB and sends SQS message", async () => {
    const result = await handler({
      type: "scheduled_job",
      agentId: "agent-1",
      payload: { jobId: "job-1" },
    });

    expect(result.statusCode).toBe(200);
    expect(result.id).toBeDefined();

    // DDB PutItem
    expect(mockDdbSend).toHaveBeenCalledTimes(1);
    const ddbInput = mockDdbSend.mock.calls[0][0].input;
    expect(ddbInput.Item._et.S).toBe("InboxItem");
    expect(ddbInput.Item.pk.S).toBe("AGENT_INBOX#agent-1");
    expect(ddbInput.Item.agentId.S).toBe("agent-1");
    expect(ddbInput.Item.type.S).toBe("scheduled_job");
    expect(ddbInput.Item.payload.S).toBe('{"jobId":"job-1"}');
    expect(ddbInput.Item.isRead.BOOL).toBe(false);
    expect(ddbInput.Item.gsi2pk.S).toBe("INBOX_UNREAD");

    // SQS SendMessage
    expect(mockSqsSend).toHaveBeenCalledTimes(1);
    const sqsInput = mockSqsSend.mock.calls[0][0].input;
    expect(JSON.parse(sqsInput.MessageBody)).toEqual({
      agentId: "agent-1",
    });
  });

  it("handles agent_self_followup event type", async () => {
    const result = await handler({
      type: "agent_self_followup",
      agentId: "agent-2",
      payload: {},
    });

    expect(result.statusCode).toBe(200);
    const ddbInput = mockDdbSend.mock.calls[0][0].input;
    expect(ddbInput.Item.type.S).toBe("agent_self_followup");
  });

  it("handles core_memory_review event type", async () => {
    const result = await handler({
      type: "core_memory_review",
      agentId: "clawd",
      payload: {},
    });

    expect(result.statusCode).toBe(200);
    const ddbInput = mockDdbSend.mock.calls[0][0].input;
    expect(ddbInput.Item.type.S).toBe("core_memory_review");
  });

  it("generates unique ids for each invocation", async () => {
    const r1 = await handler({
      type: "scheduled_job",
      agentId: "agent-1",
      payload: {},
    });
    const r2 = await handler({
      type: "scheduled_job",
      agentId: "agent-1",
      payload: {},
    });

    expect(r1.id).not.toBe(r2.id);
  });
});
