export function QueryResult({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  return (
    <>
      {loading && (
        <p className="px-4 text-sm text-neutral-500">Loading…</p>
      )}
      {error && (
        <p className="px-4 text-sm text-red-400">Error: {error}</p>
      )}
    </>
  );
}
