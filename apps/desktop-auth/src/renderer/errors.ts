/** Check if an error is a user-initiated cancellation (from CancelledError in main process). */
export function isCancelled(err: unknown): boolean {
  if (err instanceof Error) return err.message === "Login cancelled";
  return String(err).includes("Login cancelled");
}
