import { describe, expect, it } from "vitest";
import {
  agentNameColor,
  DEFAULT_AGENT_HEX_COLOR,
  hexToHue,
  hueToHex,
} from "./color";

describe("color", () => {
  it("hueToHex returns the default color for the midpoint hue", () => {
    expect(hueToHex(180)).toBe(DEFAULT_AGENT_HEX_COLOR);
  });

  it("round-trips hex → hue → hex within ±1°", () => {
    for (const h of [0, 45, 90, 135, 180, 225, 270, 315, 359]) {
      const back = hexToHue(hueToHex(h));
      // Allow wrap-around near 0/360.
      const diff = Math.min(Math.abs(back - h), 360 - Math.abs(back - h));
      expect(diff).toBeLessThan(1);
    }
  });

  it("agentNameColor falls back when no hex is provided", () => {
    expect(agentNameColor(null)).toBe(DEFAULT_AGENT_HEX_COLOR);
    expect(agentNameColor(undefined)).toBe(DEFAULT_AGENT_HEX_COLOR);
    expect(agentNameColor("#FF0000")).toBe("#FF0000");
  });

  it("hexToHue returns the default midpoint for malformed input", () => {
    expect(hexToHue("#fff")).toBe(180);
    expect(hexToHue("garbage")).toBe(180);
  });
});
