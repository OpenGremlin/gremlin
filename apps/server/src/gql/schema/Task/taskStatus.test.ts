import { describe, expect, it } from "vitest";
import { TaskStatus } from "../../resolverTypes.js";
import { statusToRaw, toTaskStatus } from "./resolvers.js";

describe("toTaskStatus", () => {
  it("maps known raw values", () => {
    expect(toTaskStatus("in_progress")).toBe(TaskStatus.InProgress);
    expect(toTaskStatus("done")).toBe(TaskStatus.Done);
    expect(toTaskStatus("closed")).toBe(TaskStatus.Closed);
  });

  it("defaults to Open for unknown values", () => {
    expect(toTaskStatus("unknown")).toBe(TaskStatus.Open);
    expect(toTaskStatus("")).toBe(TaskStatus.Open);
  });

  it("defaults to Open for undefined", () => {
    expect(toTaskStatus(undefined)).toBe(TaskStatus.Open);
  });
});

describe("statusToRaw", () => {
  it("maps all GQL enum names to raw strings", () => {
    expect(statusToRaw.OPEN).toBe("open");
    expect(statusToRaw.IN_PROGRESS).toBe("in_progress");
    expect(statusToRaw.DONE).toBe("done");
    expect(statusToRaw.CLOSED).toBe("closed");
  });

  it("returns undefined for unknown keys", () => {
    expect(statusToRaw.UNKNOWN).toBeUndefined();
  });
});
