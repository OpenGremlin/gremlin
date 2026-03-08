import type { StopInstancesCommand } from "@aws-sdk/client-ec2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as helpers from "./sandboxHelpers.js";

vi.spyOn(helpers.ec2, "send").mockImplementation(vi.fn());
vi.spyOn(helpers, "describeSandboxInstances").mockImplementation(vi.fn());
const mockDescribe = vi.mocked(helpers.describeSandboxInstances);
const mockSend = vi.mocked(helpers.ec2.send);

beforeEach(() => {
  mockDescribe.mockReset();
  mockSend.mockReset().mockResolvedValue({} as never);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

// Import handler after mocks are set up
const { handler } = await import("./sandboxSweeper.js");

describe("sandboxSweeper", () => {
  it("stops instances older than 30 minutes", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-stale",
        LaunchTime: new Date("2026-03-07T11:00:00Z"), // 60 min old
      },
      {
        InstanceId: "i-fresh",
        LaunchTime: new Date("2026-03-07T11:45:00Z"), // 15 min old
      },
    ]);

    const result = await handler();

    expect(mockDescribe).toHaveBeenCalledWith(["running"]);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const cmd = mockSend.mock.calls[0][0] as StopInstancesCommand;
    expect(cmd.input.InstanceIds).toEqual(["i-stale"]);
    expect(result).toEqual({ stopped: 1 });
  });

  it("does nothing when all instances are fresh", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-fresh",
        LaunchTime: new Date("2026-03-07T11:45:00Z"),
      },
    ]);

    const result = await handler();

    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toEqual({ stopped: 0 });
  });

  it("does nothing when no instances exist", async () => {
    mockDescribe.mockResolvedValueOnce([]);

    const result = await handler();

    expect(mockSend).not.toHaveBeenCalled();
    expect(result).toEqual({ stopped: 0 });
  });

  it("stops multiple stale instances in one call", async () => {
    mockDescribe.mockResolvedValueOnce([
      {
        InstanceId: "i-1",
        LaunchTime: new Date("2026-03-07T10:00:00Z"),
      },
      {
        InstanceId: "i-2",
        LaunchTime: new Date("2026-03-07T10:30:00Z"),
      },
    ]);

    const result = await handler();

    const cmd = mockSend.mock.calls[0][0] as StopInstancesCommand;
    expect(cmd.input.InstanceIds).toEqual(["i-1", "i-2"]);
    expect(result).toEqual({ stopped: 2 });
  });
});
