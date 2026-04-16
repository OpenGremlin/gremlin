import { afterEach, describe, expect, it } from "vitest";
import { activeLanes, laneKey } from "./laneTracking.js";

describe("laneKey", () => {
  it("concatenates agentId and lane with #", () => {
    expect(laneKey("agent-1", "main")).toBe("agent-1#main");
    expect(laneKey("agent-1", "task:abc")).toBe("agent-1#task:abc");
  });

  it("is stable for the same inputs", () => {
    expect(laneKey("a", "b")).toBe(laneKey("a", "b"));
  });
});

describe("activeLanes", () => {
  afterEach(() => {
    activeLanes.clear();
  });

  it("supports adding and removing entries (used as a reentrancy guard)", () => {
    activeLanes.add(laneKey("a", "main"));
    expect(activeLanes.has(laneKey("a", "main"))).toBe(true);
    activeLanes.delete(laneKey("a", "main"));
    expect(activeLanes.has(laneKey("a", "main"))).toBe(false);
  });

  it("tracks distinct agents separately", () => {
    activeLanes.add(laneKey("a", "main"));
    expect(activeLanes.has(laneKey("b", "main"))).toBe(false);
  });
});
