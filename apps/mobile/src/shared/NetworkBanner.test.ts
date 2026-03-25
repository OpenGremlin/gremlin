import { describe, expect, it } from "vitest";
import { deriveBannerState } from "./networkBannerState";

describe("deriveBannerState", () => {
  it("returns 'offline' when disconnected regardless of previous state", () => {
    expect(deriveBannerState(false, "hidden")).toBe("offline");
    expect(deriveBannerState(false, "offline")).toBe("offline");
    expect(deriveBannerState(false, "back-online")).toBe("offline");
  });

  it("returns 'back-online' when reconnecting from offline", () => {
    expect(deriveBannerState(true, "offline")).toBe("back-online");
  });

  it("returns 'hidden' when connected and was not offline", () => {
    expect(deriveBannerState(true, "hidden")).toBe("hidden");
    expect(deriveBannerState(true, "back-online")).toBe("hidden");
  });
});
