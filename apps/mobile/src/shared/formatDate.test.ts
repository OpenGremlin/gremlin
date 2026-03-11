import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatTime, timeAgo } from "./formatDate";

describe("formatDate", () => {
  it("returns fallback when date is null", () => {
    expect(formatDate(null)).toBe("Never");
  });

  it("returns fallback when date is undefined", () => {
    expect(formatDate(undefined)).toBe("Never");
  });

  it("returns custom fallback", () => {
    expect(formatDate(null, "N/A")).toBe("N/A");
  });

  it("formats a valid ISO date", () => {
    const result = formatDate("2025-06-15T14:30:00Z", "Never", "UTC");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
  });
});

describe("formatTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for < 1 minute ago", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    vi.setSystemTime(now);
    expect(formatTime("2025-06-15T11:59:30Z")).toBe("just now");
  });

  it("returns minutes for < 60 minutes", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    vi.setSystemTime(now);
    expect(formatTime("2025-06-15T11:45:00Z")).toBe("15m");
  });

  it("returns hours for same day", () => {
    const now = new Date("2025-06-15T18:00:00Z");
    vi.setSystemTime(now);
    expect(formatTime("2025-06-15T14:00:00Z")).toBe("4h");
  });

  it("returns 'Yesterday' for previous day", () => {
    const now = new Date("2025-06-15T10:00:00Z");
    vi.setSystemTime(now);
    expect(formatTime("2025-06-14T20:00:00Z")).toBe("Yesterday");
  });

  it("returns day abbreviation for < 6 days", () => {
    // June 15 2025 is a Sunday
    const now = new Date("2025-06-15T12:00:00Z");
    vi.setSystemTime(now);
    // June 12 is a Thursday
    const result = formatTime("2025-06-12T12:00:00Z");
    expect(result).toBe("Thu");
  });

  it("returns 'Mon D' for same year, > 6 days", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    vi.setSystemTime(now);
    const result = formatTime("2025-01-05T12:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("5");
    expect(result).not.toContain("2025");
  });

  it("returns 'Mon D, YYYY' for different year", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    vi.setSystemTime(now);
    const result = formatTime("2024-03-10T12:00:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("10");
    expect(result).toContain("2024");
  });

  it("handles yesterday correctly when > 24h ago", () => {
    // 30h ago — clearly yesterday in any timezone
    const now = new Date("2025-06-15T18:00:00Z");
    vi.setSystemTime(now);
    expect(formatTime("2025-06-14T12:00:00Z")).toBe("Yesterday");
  });
});

describe("timeAgo", () => {
  it("is an alias for formatTime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    expect(timeAgo("2025-06-15T11:55:00Z")).toBe(
      formatTime("2025-06-15T11:55:00Z"),
    );
    vi.useRealTimers();
  });
});
