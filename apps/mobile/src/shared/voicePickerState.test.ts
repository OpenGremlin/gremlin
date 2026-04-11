import { describe, expect, it } from "vitest";
import { decideToggleAction, shouldClearActive } from "./voicePickerState";

describe("decideToggleAction", () => {
  it("plays a new url when nothing is active", () => {
    expect(
      decideToggleAction("a", {
        activeUrl: null,
        playing: false,
        paused: false,
      }),
    ).toEqual({ type: "play", url: "a" });
  });

  it("plays a new url when a different one is active", () => {
    expect(
      decideToggleAction("b", {
        activeUrl: "a",
        playing: true,
        paused: false,
      }),
    ).toEqual({ type: "play", url: "b" });
  });

  it("pauses when tapping the currently playing row", () => {
    expect(
      decideToggleAction("a", {
        activeUrl: "a",
        playing: true,
        paused: false,
      }),
    ).toEqual({ type: "pause" });
  });

  it("resumes when tapping the currently paused row", () => {
    expect(
      decideToggleAction("a", {
        activeUrl: "a",
        playing: false,
        paused: true,
      }),
    ).toEqual({ type: "resume" });
  });

  it("is a noop when the active row is neither playing nor paused", () => {
    expect(
      decideToggleAction("a", {
        activeUrl: "a",
        playing: false,
        paused: false,
      }),
    ).toEqual({ type: "noop" });
  });
});

describe("shouldClearActive", () => {
  it("clears when active and all playback state is idle", () => {
    expect(
      shouldClearActive({
        activeUrl: "a",
        playing: false,
        paused: false,
        loading: false,
      }),
    ).toBe(true);
  });

  it("does not clear when nothing is active", () => {
    expect(
      shouldClearActive({
        activeUrl: null,
        playing: false,
        paused: false,
        loading: false,
      }),
    ).toBe(false);
  });

  it("does not clear while still playing", () => {
    expect(
      shouldClearActive({
        activeUrl: "a",
        playing: true,
        paused: false,
        loading: false,
      }),
    ).toBe(false);
  });

  it("does not clear while paused (user may resume)", () => {
    expect(
      shouldClearActive({
        activeUrl: "a",
        playing: false,
        paused: true,
        loading: false,
      }),
    ).toBe(false);
  });

  it("does not clear while still loading", () => {
    expect(
      shouldClearActive({
        activeUrl: "a",
        playing: false,
        paused: false,
        loading: true,
      }),
    ).toBe(false);
  });
});
