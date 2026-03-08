import type { DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { describeSandboxInstances, ec2 } from "./sandboxHelpers.js";

vi.spyOn(ec2, "send").mockImplementation(vi.fn());
const mockSend = vi.mocked(ec2.send);

beforeEach(() => {
  mockSend.mockReset();
});

describe("describeSandboxInstances", () => {
  it("returns instances matching the given states", async () => {
    mockSend.mockResolvedValueOnce({
      Reservations: [
        {
          Instances: [
            { InstanceId: "i-1", LaunchTime: new Date("2026-01-01") },
            { InstanceId: "i-2", LaunchTime: new Date("2026-01-02") },
          ],
        },
      ],
      NextToken: undefined,
    });

    const result = await describeSandboxInstances(["running"]);

    expect(result).toHaveLength(2);
    expect(result[0].InstanceId).toBe("i-1");
    expect(result[1].InstanceId).toBe("i-2");

    const cmd = mockSend.mock.calls[0][0] as DescribeInstancesCommand;
    expect(cmd.input.Filters).toEqual([
      { Name: "tag:Name", Values: ["gremlin-sandbox-*"] },
      { Name: "instance-state-name", Values: ["running"] },
    ]);
  });

  it("paginates through multiple pages", async () => {
    mockSend
      .mockResolvedValueOnce({
        Reservations: [{ Instances: [{ InstanceId: "i-1" }] }],
        NextToken: "page2",
      })
      .mockResolvedValueOnce({
        Reservations: [{ Instances: [{ InstanceId: "i-2" }] }],
        NextToken: undefined,
      });

    const result = await describeSandboxInstances(["running", "stopped"]);

    expect(result).toHaveLength(2);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when no instances found", async () => {
    mockSend.mockResolvedValueOnce({
      Reservations: [],
      NextToken: undefined,
    });

    const result = await describeSandboxInstances(["running"]);
    expect(result).toEqual([]);
  });

  it("handles multiple reservations", async () => {
    mockSend.mockResolvedValueOnce({
      Reservations: [
        { Instances: [{ InstanceId: "i-1" }] },
        { Instances: [{ InstanceId: "i-2" }, { InstanceId: "i-3" }] },
      ],
      NextToken: undefined,
    });

    const result = await describeSandboxInstances(["running"]);
    expect(result).toHaveLength(3);
  });
});
