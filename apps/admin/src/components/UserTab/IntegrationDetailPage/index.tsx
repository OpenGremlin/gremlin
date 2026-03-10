import { useState } from "react";
import { useParams } from "react-router-dom";
import { gql } from "../../../auth";
import {
  BedrockEnabledModelsQuery,
  ConnectApiKeyMutation,
  DisableBedrockModelMutation,
  EnableBedrockModelMutation,
  IntegrationProvidersQuery,
  SetDefaultModelMutation,
} from "../../../graphql/queries";
import { useQuery } from "../../../hooks/useQuery";
import { useTitle } from "../../../hooks/useTitle";
import { BackButton } from "../../../shared/BackButton";
import { IntegrationLogo } from "../../../shared/IntegrationLogo";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { ModelCard } from "./ModelCard";

function ApiKeyDetailView({
  provider,
  defaultModel,
  refetch,
}: {
  provider: {
    id: string;
    service: string;
    description: string;
    hasConnection: boolean;
    models?: ReadonlyArray<{
      id: string;
      name: string;
      contextWindow: number;
      maxTokens: number;
      reasoning: boolean;
      inputCost?: number | null;
      outputCost?: number | null;
    }> | null;
  };
  defaultModel: { providerId: string; modelId: string } | null;
  refetch: () => void;
}) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingModel, setSettingModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await gql<{ connectApiKey: string }>(ConnectApiKeyMutation, {
        providerId: provider.id,
        apiKey: apiKeyInput.trim(),
      });
      setApiKeyInput("");
      refetch();
    } catch (err) {
      setError(
        `Failed to save API key: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectModel(modelId: string) {
    setSettingModel(modelId);
    setError(null);
    try {
      await gql<{ setDefaultModel: boolean }>(SetDefaultModelMutation, {
        providerId: provider.id,
        modelId,
      });
      refetch();
    } catch (err) {
      setError(
        `Failed to set default model: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    } finally {
      setSettingModel(null);
    }
  }

  const isDefaultProvider = defaultModel?.providerId === provider.id;
  const models = provider.models ?? [];

  return (
    <>
      {/* API Key Section */}
      {!provider.hasConnection ? (
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
              placeholder={`Enter your ${provider.service} API key`}
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

      {error && (
        <div className="mt-3 bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Models Section */}
      {models.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-medium text-neutral-100 mb-3">Models</h2>
          <div className="flex flex-col gap-2">
            {models.map((model) => {
              const isDefault =
                isDefaultProvider && defaultModel?.modelId === model.id;
              const canSelect = provider.hasConnection && !isDefault;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => canSelect && handleSelectModel(model.id)}
                  disabled={!canSelect || settingModel === model.id}
                  className={`text-left transition-colors ${
                    canSelect
                      ? "hover:bg-neutral-800/80 active:bg-neutral-800 cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <ModelCard
                    model={model}
                    isDefault={isDefault}
                    actions={
                      settingModel === model.id ? (
                        <span className="text-xs text-neutral-400">
                          Setting...
                        </span>
                      ) : isDefault ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
                          <span className="text-indigo-400">Default</span>
                        </span>
                      ) : !provider.hasConnection ? (
                        <span className="text-xs text-neutral-600">
                          Add key first
                        </span>
                      ) : null
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function BedrockDetailView({
  provider,
  defaultModel,
  refetch,
}: {
  provider: {
    id: string;
    service: string;
    models?: ReadonlyArray<{
      id: string;
      name: string;
      contextWindow: number;
      maxTokens: number;
      reasoning: boolean;
      inputCost?: number | null;
      outputCost?: number | null;
    }> | null;
  };
  defaultModel: { providerId: string; modelId: string } | null;
  refetch: () => void;
}) {
  const { data: enabledData, refetch: refetchEnabled } = useQuery(
    BedrockEnabledModelsQuery,
  );
  const [enablingModel, setEnablingModel] = useState<string | null>(null);
  const [disablingModel, setDisablingModel] = useState<string | null>(null);
  const [settingModel, setSettingModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enabledModels = enabledData?.bedrockEnabledModels ?? [];
  const isDefaultProvider = defaultModel?.providerId === provider.id;
  const models = provider.models ?? [];

  async function handleEnable(modelId: string) {
    setEnablingModel(modelId);
    setError(null);
    try {
      await gql<{ enableBedrockModel: boolean }>(EnableBedrockModelMutation, {
        modelId,
      });
      refetchEnabled();
    } catch (err) {
      setError(
        `Failed to enable model: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    } finally {
      setEnablingModel(null);
    }
  }

  async function handleDisable(modelId: string) {
    setDisablingModel(modelId);
    setError(null);
    try {
      await gql<{ disableBedrockModel: boolean }>(DisableBedrockModelMutation, {
        modelId,
      });
      refetchEnabled();
      refetch();
    } catch (err) {
      setError(
        `Failed to disable model: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    } finally {
      setDisablingModel(null);
    }
  }

  async function handleSetDefault(modelId: string) {
    setSettingModel(modelId);
    setError(null);
    try {
      await gql<{ setDefaultModel: boolean }>(SetDefaultModelMutation, {
        providerId: provider.id,
        modelId,
      });
      refetch();
    } catch (err) {
      setError(
        `Failed to set default model: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    } finally {
      setSettingModel(null);
    }
  }

  return (
    <>
      <div className="mt-5 bg-neutral-900 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-100">AWS Credentials</p>
          <p className="text-xs text-neutral-500 mt-0.5">Managed server-side</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
          <span className="text-neutral-400">Connected</span>
        </span>
      </div>

      {error && (
        <div className="mt-3 bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {models.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-medium text-neutral-100 mb-3">Models</h2>
          <div className="flex flex-col gap-2">
            {models.map((model) => {
              const isEnabled = enabledModels.includes(model.id);
              const isDefault =
                isDefaultProvider && defaultModel?.modelId === model.id;
              const isEnabling = enablingModel === model.id;
              const isDisabling = disablingModel === model.id;
              const isSetting = settingModel === model.id;

              return (
                <ModelCard
                  key={model.id}
                  model={model}
                  isDefault={isDefault}
                  actions={
                    isEnabling ? (
                      <span className="text-xs text-neutral-400">
                        Testing...
                      </span>
                    ) : isDisabling ? (
                      <span className="text-xs text-neutral-400">
                        Disabling...
                      </span>
                    ) : isSetting ? (
                      <span className="text-xs text-neutral-400">
                        Setting...
                      </span>
                    ) : isDefault ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="text-indigo-400">Default</span>
                      </span>
                    ) : isEnabled ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSetDefault(model.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Set Default
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisable(model.id)}
                          className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          Disable
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEnable(model.id)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Enable
                      </button>
                    )
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function OAuthDetailView({ provider }: { provider: { service: string } }) {
  return (
    <div className="mt-5 bg-neutral-900 rounded-xl p-5">
      <p className="text-sm text-neutral-300">
        Connect {provider.service} using the{" "}
        <span className="font-medium text-neutral-100">Gremlin Connect</span>{" "}
        desktop app. The desktop app handles OAuth flows locally with your own
        credentials.
      </p>
    </div>
  );
}

export function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(IntegrationProvidersQuery);
  const provider = data?.integrationProviders.find((p) => p.id === id) ?? null;
  useTitle(provider?.service ?? "Integration");

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const defaultModel = data?.defaultModel ?? null;

  if (!provider) {
    return <NotFound label="Integration not found." />;
  }

  return (
    <div className="p-6">
      <BackButton />

      <div className="mt-4 flex items-center gap-4">
        <IntegrationLogo id={provider.id} size={12} />
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            {provider.service}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {provider.description}
          </p>
        </div>
      </div>

      {provider.connectionType === "bedrock" ? (
        <BedrockDetailView
          provider={provider}
          defaultModel={defaultModel ?? null}
          refetch={refetch}
        />
      ) : provider.connectionType === "apikey" ? (
        <ApiKeyDetailView
          provider={provider}
          defaultModel={defaultModel ?? null}
          refetch={refetch}
        />
      ) : provider.connectionType === "custom" ? (
        <p className="text-sm text-neutral-500 mt-4">
          This integration requires a custom connection flow that is not yet
          supported.
        </p>
      ) : (
        <OAuthDetailView provider={provider} />
      )}
    </div>
  );
}
