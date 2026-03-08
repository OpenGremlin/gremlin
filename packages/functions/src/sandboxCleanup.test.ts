import type { TerminateInstancesCommand } from "@aws-sdk/client-ec2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "./sandboxCleanup.js";
import * as helpers from "./sandboxHelpers.js";

vi.spyOn(helpers.ec2, "send").mockImplementation(vi.fn());
vi.spyOn(helpers, "describeSandboxInstances").mockImplementation(vi.fn());
const mockDescribe = vi.mocked(helpers.describeSandboxInstances);
const mockSend = vi.mocked(helpers.ec2.send);

beforeEach(() => {
  mockDescribe.mockReset();
  mockSend.mockReset().mockResolvedValue({} as never);
});

describe("sandboxCleanup", () => {
  it("terminates running, stopped, and pending instances on Create", async () => {
    mockDescribe.mockResolvedValueOnce([
      { InstanceId: "i-1" },
      { InstanceId: "i-2" },
    ]);

    await handler({ RequestType: "Create" });

    expect(mockDescribe).toHaveBeenCalledWith([
      "running",
      "stopped",
      "pending",
    ]);
    const cmd = mockSend.mock.calls[0][0] as TerminateInstancesCommand;
    expect(cmd.input.InstanceIds).toEqual(["i-1", "i-2"]);
  });

  it("terminates instances on Update", async () => {
    mockDescribe.mockResolvedValueOnce([{ InstanceId: "i-1" }]);

    await handler({ RequestType: "Update" });

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("skips termination on Delete", async () => {
    await handler({ RequestType: "Delete" });

    expect(mockDescribe).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("does nothing when no instances found", async () => {
    mockDescribe.mockResolvedValueOnce([]);

    await handler({ RequestType: "Create" });

    expect(mockSend).not.toHaveBeenCalled();
  });

  it("filters out instances with undefined InstanceId", async () => {
    mockDescribe.mockResolvedValueOnce([
      { InstanceId: "i-1" },
      { InstanceId: undefined },
      { InstanceId: "i-3" },
    ]);

    await handler({ RequestType: "Create" });

    const cmd = mockSend.mock.calls[0][0] as TerminateInstancesCommand;
    expect(cmd.input.InstanceIds).toEqual(["i-1", "i-3"]);
  });
});
