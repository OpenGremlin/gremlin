import { describe, expect, it } from "vitest";
import { TaskStatus } from "../../resolverTypes.js";
import { toTaskStatus } from "./resolvers.js";

describe("toTaskStatus", () => {
  it("maps known raw values", () => {
    expect(toTaskStatus("in_progress")).toBe(TaskStatus.InProgress);
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
