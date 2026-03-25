import { describe, expect, it } from "vitest";
import { deriveBannerState } from "./networkBannerState";

describe("deriveBannerState", () => {
  it("returns 'offline' when disconnected", () => {
    expect(deriveBannerState(false)).toBe("offline");
  });

  it("returns 'hidden' when connected", () => {
    expect(deriveBannerState(true)).toBe("hidden");
  });
});
