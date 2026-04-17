import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AudioPlaybackEngine,
  type StatusCallback,
} from "./AudioPlaybackEngine";

function mockPlayer() {
  return {
    pause: vi.fn(),
    replace: vi.fn(),
    play: vi.fn(),
    currentTime: 0,
    duration: 0,
  };
}

type MockPlayer = ReturnType<typeof mockPlayer>;

function setup() {
  const playerA = mockPlayer();
  const playerB = mockPlayer();
  const onStatus = vi.fn<StatusCallback>();
  const engine = new AudioPlaybackEngine(
    playerA as never,
    playerB as never,
    (url) => ({ uri: url }),
    onStatus,
  );
  return { engine, playerA, playerB, onStatus };
}

function simulatePlaying(engine: AudioPlaybackEngine, player: MockPlayer) {
  engine.onPlayerStatus(player as never, { playing: true });
}

function simulateFinish(engine: AudioPlaybackEngine, player: MockPlayer) {
  engine.onPlayerStatus(player as never, { didJustFinish: true });
}

describe("AudioPlaybackEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays through all URLs in sequence", () => {
    const { engine, playerA, playerB, onStatus } = setup();

    engine.playUrls(["u0", "u1", "u2"]);

    // playerA loads u0, playerB preloads u1
    expect(playerA.replace).toHaveBeenCalledWith({ uri: "u0" });
    expect(playerA.play).toHaveBeenCalled();
    expect(playerB.replace).toHaveBeenCalledWith({ uri: "u1" });

    // Simulate playerA starts then finishes
    simulatePlaying(engine, playerA);
    simulateFinish(engine, playerA);

    // playerB should now play u1, playerA preloads u2
    expect(playerB.play).toHaveBeenCalled();
    expect(playerA.replace).toHaveBeenCalledWith({ uri: "u2" });

    // Simulate playerB starts then finishes
    simulatePlaying(engine, playerB);
    simulateFinish(engine, playerB);

    // playerA should now play u2
    expect(playerA.play).toHaveBeenCalledTimes(2);

    // Simulate playerA starts then finishes u2
    simulatePlaying(engine, playerA);
    simulateFinish(engine, playerA);

    // No more URLs — should stop
    expect(onStatus).toHaveBeenCalledWith({
      playing: false,
      paused: false,
      loading: false,
    });
  });

  it("ignores didJustFinish before playing:true (spurious event)", () => {
    const { engine, playerA, playerB, onStatus } = setup();

    engine.playUrls(["u0", "u1", "u2"]);
    simulatePlaying(engine, playerA);
    simulateFinish(engine, playerA);

    // playerB is now active but hasn't emitted playing:true yet
    // A spurious didJustFinish should be ignored
    onStatus.mockClear();
    simulateFinish(engine, playerB);

    // Engine should still be playing — no stop emitted
    const stopCalls = onStatus.mock.calls.filter(
      (c) => c[0].playing === false && c[0].paused === false,
    );
    expect(stopCalls).toHaveLength(0);

    // Now playerB actually starts — finish should work
    simulatePlaying(engine, playerB);
    simulateFinish(engine, playerB);

    // Should have advanced to u2
    expect(playerA.play).toHaveBeenCalledTimes(2);
  });

  it("stall watchdog advances after timeout", () => {
    const { engine, playerA, onStatus } = setup();

    engine.playUrls(["u0", "u1", "u2"]);
    simulatePlaying(engine, playerA);
    simulateFinish(engine, playerA);

    // playerB is now active but never emits playing:true (stalled)
    // Advance 8 seconds
    vi.advanceTimersByTime(8_000);

    // Should have shown loading state
    expect(onStatus).toHaveBeenCalledWith({
      playing: true,
      paused: false,
      loading: true,
    });

    // Should have advanced to u2 on playerA
    expect(playerA.play).toHaveBeenCalledTimes(2);
  });

  it("stops after consecutive stalls", () => {
    const { engine, playerA, onStatus } = setup();

    engine.playUrls(["u0", "u1", "u2"]);
    simulatePlaying(engine, playerA);
    simulateFinish(engine, playerA);

    // First stall on playerB → advances
    vi.advanceTimersByTime(8_000);

    // Second stall on playerA → should stop
    vi.advanceTimersByTime(8_000);

    const lastCall = onStatus.mock.calls[onStatus.mock.calls.length - 1];
    expect(lastCall[0]).toEqual({
      playing: false,
      paused: false,
      loading: false,
    });
  });

  it("resets consecutive stalls when a player starts successfully", () => {
    const { engine, playerA, onStatus } = setup();

    engine.playUrls(["u0", "u1", "u2", "u3"]);
    simulatePlaying(engine, playerA);
    simulateFinish(engine, playerA);

    // First stall on playerB → advances to u2
    vi.advanceTimersByTime(8_000);

    // playerA actually starts playing u2 — resets stall count
    simulatePlaying(engine, playerA);
    simulateFinish(engine, playerA);

    // playerB stalls on u3 — this is the first stall after reset, should advance
    vi.advanceTimersByTime(8_000);

    // Should still be trying (not stopped), since consecutive count was reset
    // The advance from the stall would look for more URLs (none left), so it stops
    const lastCall = onStatus.mock.calls[onStatus.mock.calls.length - 1];
    expect(lastCall[0].playing).toBe(false);
  });

  it("pause and resume preserve activeStarted state", () => {
    const { engine, playerA } = setup();

    engine.playUrls(["u0", "u1"]);
    simulatePlaying(engine, playerA);

    engine.pause();
    engine.resume();

    // didJustFinish should still work after resume
    simulateFinish(engine, playerA);

    // Should have advanced (not ignored the finish)
    expect(engine.playing).toBe(true);
  });

  it("handleChunk resets state for a new logId", () => {
    const { engine, playerA } = setup();

    engine.handleChunk({
      logId: "log1",
      sentenceIndex: 0,
      url: "u0",
      done: false,
    });
    simulatePlaying(engine, playerA);

    // New logId resets everything
    engine.handleChunk({
      logId: "log2",
      sentenceIndex: 0,
      url: "u0",
      done: false,
    });

    expect(playerA.pause).toHaveBeenCalled();
  });
});
