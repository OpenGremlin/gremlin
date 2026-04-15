import { useCallback, useState } from "react";

interface MutationAction {
  run: (...args: unknown[]) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Wraps an async action with loading + error state management.
 * Replaces the common `try { setLoading(true); ... } catch { setError(...) } finally { setLoading(false) }` pattern.
 */
export function useMutationAction(
  action: (...args: unknown[]) => Promise<unknown>,
): MutationAction {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: unknown[]) => {
      setLoading(true);
      setError(null);
      try {
        await action(...args);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, loading, error, clearError };
}
