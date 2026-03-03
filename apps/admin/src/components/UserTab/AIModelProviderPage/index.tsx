import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import {
  ModelProvidersQuery,
  RemoveProviderApiKeyMutation,
  SetActiveModelMutation,
  SetProviderApiKeyMutation,
} from "../../../graphql/queries";
import { BackButton } from "../../../shared/BackButton";
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
      className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-semibold ${colorClass}`}
    >
      {name[0]}
    </div>
  );
}

export function AIModelProviderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(ModelProvidersQuery);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [settingModel, setSettingModel] = useState<string | null>(null);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const provider = data?.modelProviders.find((p) => p.id === id) ?? null;
  const activeModel = data?.activeModel ?? null;

  if (!provider) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="text-neutral-400 mt-4">Provider not found.</p>
      </div>
    );
  }

  async function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    try {
      await gql<{ setProviderApiKey: boolean }>(SetProviderApiKeyMutation, {
        providerId: id,
        apiKey: apiKeyInput.trim(),
      });
      setApiKeyInput("");
      refetch();
    } catch (err) {
      console.error("Failed to save API key:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveApiKey() {
    setRemoving(true);
    try {
      await gql<{ removeProviderApiKey: boolean }>(
        RemoveProviderApiKeyMutation,
        { providerId: id },
      );
      refetch();
    } catch (err) {
      console.error("Failed to remove API key:", err);
    } finally {
      setRemoving(false);
    }
  }

  async function handleSelectModel(modelId: string) {
    setSettingModel(modelId);
    try {
      await gql<{ setActiveModel: boolean }>(SetActiveModelMutation, {
        providerId: id,
        modelId,
      });
      refetch();
    } catch (err) {
      console.error("Failed to set active model:", err);
    } finally {
      setSettingModel(null);
    }
  }

  const isActiveProvider = activeModel?.providerId === id;

  return (
    <div className="px-4 pt-6 pb-6">
      <div className="flex items-center justify-between">
        <BackButton />
        {provider.hasApiKey && (
          <button
            type="button"
            onClick={handleRemoveApiKey}
            disabled={removing}
            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {removing ? "Removing..." : "Remove API Key"}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <ProviderLogo id={provider.id} name={provider.name} />
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            {provider.name}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {provider.models.length} models available
          </p>
        </div>
      </div>

      {/* API Key Section */}
      {!provider.hasApiKey ? (
        <div className="mt-5">
          <label
            htmlFor="api-key"
            className="text-sm font-medium text-neutral-100 mb-2 block"
          >
            API Key
          </label>
          <div className="flex gap-2">
            <input
              id="api-key"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={`Enter your ${provider.name} API key`}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
            />
            <button
              type="button"
              onClick={handleSaveApiKey}
              disabled={saving || !apiKeyInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 bg-neutral-900 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-100">API Key</p>
            <p className="text-xs text-neutral-500 mt-0.5">Configured</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            <span className="text-neutral-400">Active</span>
          </span>
        </div>
      )}

      {/* Models Section */}
      <div className="mt-5">
        <h2 className="text-sm font-medium text-neutral-100 mb-3">Models</h2>
        <div className="flex flex-col gap-2">
          {provider.models.map((model) => {
            const isActive =
              isActiveProvider && activeModel?.modelId === model.id;
            const canSelect = provider.hasApiKey && !isActive;

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => canSelect && handleSelectModel(model.id)}
                disabled={!canSelect || settingModel === model.id}
                className={`flex items-center justify-between bg-neutral-900 rounded-xl p-4 text-left transition-colors ${
                  canSelect
                    ? "hover:bg-neutral-800/80 active:bg-neutral-800 cursor-pointer"
                    : "cursor-default"
                } ${isActive ? "ring-1 ring-indigo-500/50" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-100">
                      {model.name}
                    </span>
                    {model.reasoning && (
                      <span className="text-[10px] font-medium bg-violet-500/20 text-violet-400 rounded px-1.5 py-0.5">
                        Reasoning
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-neutral-500">
                      {(model.contextWindow / 1000).toFixed(0)}k context
                    </span>
                    {model.inputCost != null && (
                      <span className="text-xs text-neutral-500">
                        ${model.inputCost}/M in
                      </span>
                    )}
                    {model.outputCost != null && (
                      <span className="text-xs text-neutral-500">
                        ${model.outputCost}/M out
                      </span>
                    )}
                  </div>
                </div>
                {settingModel === model.id ? (
                  <span className="text-xs text-neutral-400">Setting...</span>
                ) : isActive ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-indigo-400">Active</span>
                  </span>
                ) : !provider.hasApiKey ? (
                  <span className="text-xs text-neutral-600">
                    Add key first
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
