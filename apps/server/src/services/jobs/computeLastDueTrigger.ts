import { CronExpressionParser } from "cron-parser";

const CATCH_UP_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Given a cron expression, returns the most recent past occurrence (in epoch ms)
 * if it falls within a 3-hour catch-up window. Returns null otherwise.
 */
export function computeLastDueTrigger(
  cronExpression: string,
  now: number = Date.now(),
  tz: string = "UTC",
): number | null {
  try {
    const expr = CronExpressionParser.parse(cronExpression, {
      currentDate: new Date(now),
      tz,
    });
    const prev = expr.prev();
    const prevMs = prev.toDate().getTime();

    if (now - prevMs <= CATCH_UP_MS) {
      return prevMs;
    }
    return null;
  } catch {
    return null;
  }
}
