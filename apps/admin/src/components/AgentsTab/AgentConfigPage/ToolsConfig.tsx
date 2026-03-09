import { Bot, Globe, Terminal } from "lucide-react";
import { useState } from "react";
import { gql } from "../../../auth";
import type {
  AgentQuery,
  UpdateAgentMutation,
} from "../../../graphql/generated/graphql";
import {
  BedrockEnabledModelsQuery,
  IntegrationProvidersQuery,
  UpdateAgentMutation as UpdateAgentDoc,
} from "../../../graphql/queries";
import { useQuery } from "../../../hooks/useQuery";
import { ModelPicker } from "./ModelPicker";

type Agent = NonNullable<AgentQuery["agent"]>;

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-indigo-500" : "bg-neutral-700"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

function ConfigRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-neutral-400">{icon}</div>
          <div>
            <div className="text-sm font-medium text-neutral-200">{label}</div>
            <div className="text-xs text-neutral-500">{description}</div>
          </div>
        </div>
        <Toggle enabled={enabled} onChange={onToggle} />
      </div>
      {enabled && children && <div className="mt-3 pl-9">{children}</div>}
    </div>
  );
}

interface PlainConfig {
  model?: { type: string; modelId?: string; connectionId?: string };
  sandbox?: {
    enabled: boolean;
    idleTimeoutMinutes?: number;
    alwaysOn?: boolean;
  };
  webSearch?: { enabled: boolean; provider?: string };
}

function toPlainConfig(config: Agent["config"]): PlainConfig {
  return {
    model: config?.model
      ? {
          type: config.model.type,
          modelId: config.model.modelId ?? undefined,
          connectionId: config.model.connectionId ?? undefined,
        }
      : undefined,
    sandbox: config?.sandbox
      ? {
          enabled: config.sandbox.enabled,
          idleTimeoutMinutes: config.sandbox.idleTimeoutMinutes ?? undefined,
          alwaysOn: config.sandbox.alwaysOn ?? undefined,
        }
      : undefined,
    webSearch: config?.webSearch
      ? {
          enabled: config.webSearch.enabled,
          provider: config.webSearch.provider ?? undefined,
        }
      : undefined,
  };
}

function SandboxSettings({
  sandbox,
  onChange,
}: {
  sandbox: NonNullable<PlainConfig["sandbox"]>;
  onChange: (v: NonNullable<PlainConfig["sandbox"]>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-300">Keep running</div>
          <div className="text-xs text-neutral-500">
            Don't shut down sandbox after idle timeout
          </div>
        </div>
        <Toggle
          enabled={sandbox.alwaysOn ?? false}
          onChange={(v) => onChange({ ...sandbox, alwaysOn: v })}
        />
      </div>
      {!sandbox.alwaysOn && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-neutral-300">Idle shutdown</span>
            <span className="text-sm text-neutral-400 tabular-nums">
              {sandbox.idleTimeoutMinutes ?? 20} min
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={sandbox.idleTimeoutMinutes ?? 20}
            onChange={(e) =>
              onChange({
                ...sandbox,
                idleTimeoutMinutes: Number(e.target.value),
              })
            }
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-0.5">
            <span>10 min</span>
            <span>120 min</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ToolsConfig({ agent }: { agent: Agent }) {
  const { data: providersData } = useQuery(IntegrationProvidersQuery);
  const { data: bedrockData } = useQuery(BedrockEnabledModelsQuery);
  const providers = providersData?.integrationProviders ?? [];
  const bedrockModels = bedrockData?.bedrockEnabledModels ?? [];
  const webSearchProviders = providers.filter(
    (p) => p.category === "web" && p.hasConnection,
  );
  const hasWebSearch = webSearchProviders.length > 0;

  const [localConfig, setLocalConfig] = useState(() =>
    toPlainConfig(agent.config),
  );
  const [saving, setSaving] = useState(false);

  // Sync from server when agent prop updates
  const serverConfig = agent.config;
  const [lastServerConfig, setLastServerConfig] = useState(serverConfig);
  if (serverConfig !== lastServerConfig) {
    setLastServerConfig(serverConfig);
    setLocalConfig(toPlainConfig(serverConfig));
  }

  const config = localConfig;

  async function updateConfig(patch: Partial<typeof config>) {
    const merged = { ...config, ...patch };
    setLocalConfig(merged);
    setSaving(true);
    try {
      await gql<UpdateAgentMutation>(UpdateAgentDoc, {
        id: agent.id,
        input: { config: merged },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
        Tools {saving && <span className="text-neutral-600">saving...</span>}
      </h3>

      <ConfigRow
        icon={<Bot size={18} />}
        label="Model"
        description="LLM provider for inference"
        enabled={!!config?.model}
        onToggle={(v) =>
          updateConfig({
            model: v
              ? {
                  type: "bedrock",
                  modelId: "us.anthropic.claude-sonnet-4-20250514-v1:0",
                }
              : undefined,
          })
        }
      >
        {config?.model && (
          <ModelPicker
            model={config.model}
            providers={providers}
            bedrockModels={bedrockModels}
            onSelect={(value) => updateConfig({ model: value })}
          />
        )}
      </ConfigRow>

      <ConfigRow
        icon={<Terminal size={18} />}
        label="Sandbox"
        description="Bash shell for running commands"
        enabled={config?.sandbox?.enabled ?? false}
        onToggle={(v) =>
          updateConfig({
            sandbox: v
              ? {
                  enabled: true,
                  idleTimeoutMinutes: config?.sandbox?.idleTimeoutMinutes ?? 20,
                  alwaysOn: config?.sandbox?.alwaysOn ?? false,
                }
              : { enabled: false },
          })
        }
      >
        {config?.sandbox?.enabled && (
          <SandboxSettings
            sandbox={config.sandbox}
            onChange={(sandbox) => updateConfig({ sandbox })}
          />
        )}
      </ConfigRow>

      <ConfigRow
        icon={<Globe size={18} />}
        label="Web Search"
        description={
          hasWebSearch
            ? "Search the web for information"
            : "Connect Brave Search or Tavily in Integrations to enable"
        }
        enabled={config?.webSearch?.enabled ?? false}
        onToggle={(v) =>
          hasWebSearch
            ? updateConfig({
                webSearch: {
                  enabled: v,
                  provider:
                    config?.webSearch?.provider ??
                    webSearchProviders[0]?.id ??
                    "brave",
                },
              })
            : undefined
        }
      >
        {config?.webSearch?.enabled && (
          <div className="flex flex-col gap-2">
            {hasWebSearch ? (
              <div className="flex flex-col gap-1.5">
                {webSearchProviders.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      updateConfig({
                        webSearch: { enabled: true, provider: p.id },
                      })
                    }
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      (
                        config.webSearch?.provider ?? webSearchProviders[0]?.id
                      ) === p.id
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-neutral-100"
                        : "bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {p.service}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-400">
                No search provider connected. Add a Brave Search or Tavily API
                key in Integrations.
              </p>
            )}
          </div>
        )}
      </ConfigRow>
    </div>
  );
}
