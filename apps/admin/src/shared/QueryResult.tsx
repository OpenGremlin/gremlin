import { BackButton } from "./BackButton";

export function QueryResult({
  loading,
  error,
  backButton,
}: {
  loading: boolean;
  error: string | null;
  backButton?: boolean;
}) {
  if (!loading && !error) return null;

  if (backButton) {
    return (
      <div className="px-6 pt-6">
        <BackButton />
        {loading && <p className="text-neutral-500 mt-4 text-sm">Loading…</p>}
        {error && <p className="text-red-400 mt-4 text-sm">Error: {error}</p>}
      </div>
    );
  }

  return (
    <>
      {loading && <p className="px-6 text-sm text-neutral-500">Loading…</p>}
      {error && <p className="px-6 text-sm text-red-400">Error: {error}</p>}
    </>
  );
}

export function NotFound({ label }: { label: string }) {
  return (
    <div className="px-6 pt-6">
      <BackButton />
      <p className="text-neutral-400 mt-4">{label}</p>
    </div>
  );
}
