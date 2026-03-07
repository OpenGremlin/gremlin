import { describe, expect, it } from "vitest";
import { formatDate, formatTime } from "./formatDate";

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60_000).toISOString();
}
function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3_600_000).toISOString();
}
function _daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

describe("formatTime", () => {
  it("returns 'just now' for under a minute", () => {
    expect(formatTime(new Date(Date.now() - 10_000).toISOString())).toBe(
      "just now",
    );
  });

  it("returns minutes for < 60 min", () => {
    expect(formatTime(minutesAgo(5))).toBe("5m");
    expect(formatTime(minutesAgo(30))).toBe("30m");
  });

  it("returns hours for same-day", () => {
    // Create a date that's definitely same-day and > 1hr ago
    const now = new Date();
    if (now.getHours() >= 2) {
      expect(formatTime(hoursAgo(2))).toBe("2h");
    }
  });

  it("returns 'Yesterday' for previous day", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    expect(formatTime(yesterday.toISOString())).toBe("Yesterday");
  });

  it("returns day of week for 2-5 days ago", () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date(Date.now() - 3 * 86_400_000);
    expect(formatTime(d.toISOString())).toBe(days[d.getDay()]);
  });

  it("returns month/day for same year, > 5 days", () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    const result = formatTime(d.toISOString());
    expect(result).toMatch(/^\w{3} \d{1,2}$/);
  });

  it("returns month/day/year for different year", () => {
    const result = formatTime("2020-06-15T12:00:00Z");
    expect(result).toMatch(/Jun 15, 2020/);
  });
});

describe("formatDate", () => {
  it("returns fallback for null/undefined", () => {
    expect(formatDate(null)).toBe("Never");
    expect(formatDate(undefined)).toBe("Never");
    expect(formatDate(null, "N/A")).toBe("N/A");
  });

  it("formats a valid date", () => {
    const result = formatDate("2024-03-15T14:30:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("15");
  });
});
