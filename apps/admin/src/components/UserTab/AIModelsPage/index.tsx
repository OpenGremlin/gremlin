import { Link } from "react-router-dom";
import { ModelProvidersQuery } from "../../../graphql/queries";
import { QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";

function ProviderLogo({ id, name }: { id: string; name: string }) {
  const colors: Record<string, string> = {
    anthropic: "bg-orange-900/60 text-orange-300",
    openai: "bg-emerald-900/60 text-emerald-300",
    google: "bg-blue-900/60 text-blue-300",
  };
  const colorClass = colors[id] ?? "bg-neutral-800 text-neutral-400";

  return (
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-semibold ${colorClass}`}
    >
      {name[0]}
    </div>
  );
}

function StatusBadge({ hasApiKey }: { hasApiKey: boolean }) {
  if (hasApiKey) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
      No API key
    </span>
  );
}

function ActiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-indigo-400">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
      Active
    </span>
  );
}

function ChevronRight() {
  return (
    <svg
      className="h-5 w-5 text-neutral-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function AIModelsPage() {
  const { data, loading, error } = useQuery(ModelProvidersQuery);

  const providers = data?.modelProviders ?? [];
  const activeModel = data?.activeModel ?? null;

  return (
    <>
      <QueryResult loading={loading} error={error} />
      <div className="flex flex-col gap-3 px-4 pb-6">
        {!loading && !activeModel && (
          <div className="bg-neutral-900 rounded-xl p-4 text-sm text-neutral-400">
            No active model selected. Using default Bedrock Claude Sonnet 4.
            Configure a provider below to use your own API key.
          </div>
        )}
        {!loading && activeModel && (
          <div className="bg-neutral-900 rounded-xl p-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              Active Model
            </p>
            <p className="text-sm font-medium text-neutral-100">
              {providers
                .find((p) => p.id === activeModel.providerId)
                ?.models.find((m) => m.id === activeModel.modelId)?.name ??
                activeModel.modelId}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {providers.find((p) => p.id === activeModel.providerId)?.name ??
                activeModel.providerId}
            </p>
          </div>
        )}

        <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">
          Providers
        </h3>
        {providers.map((provider) => {
          const isActive = activeModel?.providerId === provider.id;
          return (
            <Link
              key={provider.id}
              to={`/aimodels/${provider.id}`}
              className="flex items-center gap-3 bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80 active:bg-neutral-800"
            >
              <ProviderLogo id={provider.id} name={provider.name} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-neutral-100">
                  {provider.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge hasApiKey={provider.hasApiKey} />
                  {isActive && <ActiveBadge />}
                </div>
              </div>
              <span className="text-xs text-neutral-500">
                {provider.models.length} models
              </span>
              <ChevronRight />
            </Link>
          );
        })}
      </div>
    </>
  );
}
