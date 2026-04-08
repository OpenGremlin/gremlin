import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const impactAsync = vi.fn();
const notificationAsync = vi.fn();

vi.mock("expo-haptics", () => ({
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Error: "error",
  },
}));

// `isNative` in haptics.ts is captured at module load from process.env.EXPO_OS,
// so each describe block sets the env then re-imports the module fresh via
// vi.resetModules() to exercise both the native and web branches.

describe("haptics on native (EXPO_OS=ios)", () => {
  let haptics: typeof import("./haptics").haptics;

  beforeEach(async () => {
    impactAsync.mockClear();
    notificationAsync.mockClear();
    vi.stubEnv("EXPO_OS", "ios");
    vi.resetModules();
    ({ haptics } = await import("./haptics"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("light() triggers a light impact", () => {
    haptics.light();
    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenCalledWith("light");
  });

  it("medium() triggers a medium impact", () => {
    haptics.medium();
    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenCalledWith("medium");
  });

  it("heavy() triggers a heavy impact", () => {
    haptics.heavy();
    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenCalledWith("heavy");
  });

  it("never calls notificationAsync — only impacts are wired", () => {
    haptics.light();
    haptics.medium();
    haptics.heavy();
    expect(notificationAsync).not.toHaveBeenCalled();
  });
});

describe("haptics on web (EXPO_OS=web)", () => {
  let haptics: typeof import("./haptics").haptics;

  beforeEach(async () => {
    impactAsync.mockClear();
    notificationAsync.mockClear();
    vi.stubEnv("EXPO_OS", "web");
    vi.resetModules();
    ({ haptics } = await import("./haptics"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("light() is a no-op", () => {
    haptics.light();
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it("medium() is a no-op", () => {
    haptics.medium();
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it("heavy() is a no-op", () => {
    haptics.heavy();
    expect(impactAsync).not.toHaveBeenCalled();
  });
});
