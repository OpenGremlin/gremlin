/**
 * Structured JSON logger for CloudWatch.
 * Every line is a single JSON object so CloudWatch Logs Insights can query it.
 */
export function log(
  component: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    component,
    message,
    ...data,
  };
  console.log(JSON.stringify(entry));
}
