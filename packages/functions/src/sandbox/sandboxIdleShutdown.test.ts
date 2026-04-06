import type { StopInstancesCommand } from "@aws-sdk/client-ec2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as helpers from "./sandboxHelpers.js";

vi.spyOn(helpers.ec2, "send").mockImplementation(vi.fn());
vi.spyOn(helpers, "describeSandboxInstances").mockImplementation(vi.fn());
const mockDescribe = vi.mocked(helpers.describeSandboxInstances);
const mockSend = vi.mocked(helpers.ec2.send);

const mockGetItem = vi.fn();
vi.mock("dynamodb-toolbox/entity/actions/get", () => ({
  GetItemCommand: class {
    _entity: unknown;
    _key: unknown;
    constructor(entity: unknown) {
      this._entity = entity;
    }
    key(k: unknown) {
      this._key = k;
      return this;
    }
    send() {
      return mockGetItem(this._key);
    }
  },
}));

vi.mock("@opengremlin/lib/resources/ddb/schema/agent.js", () => ({
  AgentEntity: {
    build: (Cmd: new (entity: unknown) => unknown) => new Cmd("AgentEntity"),
  },
}));

vi.mock("@opengremlin/lib/logger.js", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

beforeEach(() => {
  mockDescribe.mockReset();
  mockSend.mockReset().mockResolvedValue({} as never);
  mockGetItem.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

const { handler } = await import("./sandboxIdleShutdown.js");

describe("sandboxIdleShutdown", () => {
  it("uses default 20 min timeout when agent has no config", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-1",
        LaunchTime: new Date("2026-03-07T11:30:00Z"), // 30 min old
        Tags: [{ Key: "gremlin:agentId", Value: "agent-1" }],
      },
    ]);
    mockGetItem.mockResolvedValueOnce({ Item: { config: undefined } });

    const result = await handler();

    expect(result).toEqual({ stopped: 1 });
  });

  it("respects per-agent idleTimeoutMinutes", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-short",
        LaunchTime: new Date("2026-03-07T11:45:00Z"), // 15 min old
        Tags: [{ Key: "gremlin:agentId", Value: "agent-short" }],
      },
      {
        InstanceId: "i-long",
        LaunchTime: new Date("2026-03-07T11:45:00Z"), // 15 min old
        Tags: [{ Key: "gremlin:agentId", Value: "agent-long" }],
      },
    ]);
    // agent-short: 10 min timeout → stale at 15 min
    mockGetItem.mockResolvedValueOnce({
      Item: {
        config: { sandbox: { enabled: true, idleTimeoutMinutes: 10 } },
      },
    });
    // agent-long: 60 min timeout → fresh at 15 min
    mockGetItem.mockResolvedValueOnce({
      Item: {
        config: { sandbox: { enabled: true, idleTimeoutMinutes: 60 } },
      },
    });

    const result = await handler();

    expect(result).toEqual({ stopped: 1 });
    const cmd = mockSend.mock.calls[0][0] as StopInstancesCommand;
    expect(cmd.input.InstanceIds).toEqual(["i-short"]);
  });

  it("skips always-on sandboxes", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-always",
        LaunchTime: new Date("2026-03-07T08:00:00Z"), // 4 hours old
        Tags: [{ Key: "gremlin:agentId", Value: "agent-always" }],
      },
    ]);
    mockGetItem.mockResolvedValueOnce({
      Item: {
        config: { sandbox: { enabled: true, alwaysOn: true } },
      },
    });

    const result = await handler();

    expect(result).toEqual({ stopped: 0 });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("uses defaults when DDB lookup fails", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-err",
        LaunchTime: new Date("2026-03-07T11:30:00Z"), // 30 min old > 20 min default
        Tags: [{ Key: "gremlin:agentId", Value: "agent-err" }],
      },
    ]);
    mockGetItem.mockRejectedValueOnce(new Error("DDB unavailable"));

    const result = await handler();

    expect(result).toEqual({ stopped: 1 });
  });

  it("uses defaults when instance has no agentId tag", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-noagent",
        LaunchTime: new Date("2026-03-07T11:30:00Z"), // 30 min old
        Tags: [],
      },
    ]);

    const result = await handler();

    // No DDB call since no agentId
    expect(mockGetItem).not.toHaveBeenCalled();
    expect(result).toEqual({ stopped: 1 });
  });

  it("does nothing when no instances exist", async () => {
    mockDescribe.mockResolvedValueOnce([]);

    const result = await handler();

    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toEqual({ stopped: 0 });
  });

  it("stops multiple stale instances in one EC2 call", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-1",
        LaunchTime: new Date("2026-03-07T10:00:00Z"),
        Tags: [{ Key: "gremlin:agentId", Value: "a1" }],
      },
      {
        InstanceId: "i-2",
        LaunchTime: new Date("2026-03-07T10:00:00Z"),
        Tags: [{ Key: "gremlin:agentId", Value: "a2" }],
      },
    ]);
    mockGetItem.mockResolvedValue({ Item: { config: undefined } });

    const result = await handler();

    expect(result).toEqual({ stopped: 2 });
    expect(mockSend).toHaveBeenCalledTimes(2);
    const ids = mockSend.mock.calls.map(
      (c) => (c[0] as StopInstancesCommand).input.InstanceIds?.[0],
    );
    expect(ids.sort()).toEqual(["i-1", "i-2"]);
  });
});
