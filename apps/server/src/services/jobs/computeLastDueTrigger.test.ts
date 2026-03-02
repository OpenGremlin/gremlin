import { describe, it, expect } from "vitest";
import { computeLastDueTrigger } from "./computeLastDueTrigger.js";

describe("computeLastDueTrigger", () => {
  it("returns trigger time for cron that fired recently (5 min ago)", () => {
    // "every 10 minutes" — at :00, :10, :20, :30, :40, :50
    // Set now to XX:05 so the most recent fire was at XX:00 (5 min ago)
    const now = new Date("2026-03-02T12:05:00Z").getTime();
    const result = computeLastDueTrigger("*/10 * * * *", now);
    expect(result).toBe(new Date("2026-03-02T12:00:00Z").getTime());
  });

  it("returns null for cron whose last fire is outside 3hr window", () => {
    // "at midnight daily" — last fire was midnight, now is 04:00 (4hrs later)
    const now = new Date("2026-03-02T04:00:00Z").getTime();
    const result = computeLastDueTrigger("0 0 * * *", now);
    expect(result).toBeNull();
  });

  it("returns null for invalid cron expression", () => {
    const result = computeLastDueTrigger("not a cron");
    expect(result).toBeNull();
  });

  it("returns trigger time right at the 3hr boundary", () => {
    // "at midnight daily" — now is exactly 03:00 (3hrs later, within window)
    const now = new Date("2026-03-02T03:00:00Z").getTime();
    const result = computeLastDueTrigger("0 0 * * *", now);
    expect(result).toBe(new Date("2026-03-02T00:00:00Z").getTime());
  });

  it("evaluates cron in the given timezone", () => {
    // "at 9am daily" in America/New_York (UTC-5 in winter)
    // 9am ET = 14:00 UTC. At 14:05 UTC the last trigger should be 14:00 UTC.
    const now = new Date("2026-03-02T14:05:00Z").getTime();
    const result = computeLastDueTrigger("0 9 * * *", now, "America/New_York");
    expect(result).toBe(new Date("2026-03-02T14:00:00Z").getTime());
  });

  it("returns null when timezone shifts trigger outside catch-up window", () => {
    // "at 9am daily" in UTC → last fire 09:00 UTC
    // At 13:00 UTC that's 4hrs ago → outside window
    const now = new Date("2026-03-02T13:00:00Z").getTime();
    const result = computeLastDueTrigger("0 9 * * *", now, "UTC");
    expect(result).toBeNull();
  });

  it("defaults to UTC when no timezone provided", () => {
    // "at noon daily" — at 12:30 UTC, last fire was 12:00 UTC
    const now = new Date("2026-03-02T12:30:00Z").getTime();
    const result = computeLastDueTrigger("0 12 * * *", now);
    expect(result).toBe(new Date("2026-03-02T12:00:00Z").getTime());
  });
});
