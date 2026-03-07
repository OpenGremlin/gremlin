import { Bot, Globe, MonitorSmartphone, Terminal } from "lucide-react";
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
import { useQuery } from "../../../useQuery";
import { ModelPicker } from "./ModelPicker";

type Agent = NonNullable<AgentQuery["agent"]>;
type AgentConfig = NonNullable<Agent["config"]>;

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
  sandbox?: { enabled: boolean };
  webSearch?: { enabled: boolean; provider?: string };
  browser?: { enabled: boolean };
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
    sandbox: config?.sandbox ? { enabled: config.sandbox.enabled } : undefined,
    webSearch: config?.webSearch
      ? {
          enabled: config.webSearch.enabled,
          provider: config.webSearch.provider ?? undefined,
        }
      : undefined,
    browser: config?.browser ? { enabled: config.browser.enabled } : undefined,
  };
}

export function ToolsConfig({ agent }: { agent: Agent }) {
  const { data: providersData } = useQuery(IntegrationProvidersQuery);
  const { data: bedrockData } = useQuery(BedrockEnabledModelsQuery);
  const providers = providersData?.integrationProviders ?? [];
  const bedrockModels = bedrockData?.bedrockEnabledModels ?? [];
  const hasBrave = providers.some((p) => p.id === "brave" && p.hasConnection);

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
        onToggle={(v) => updateConfig({ sandbox: { enabled: v } })}
      />

      <ConfigRow
        icon={<Globe size={18} />}
        label="Web Search"
        description={
          hasBrave
            ? "Search the web via Brave Search"
            : "Connect Brave Search in Integrations to enable"
        }
        enabled={config?.webSearch?.enabled ?? false}
        onToggle={(v) =>
          hasBrave
            ? updateConfig({ webSearch: { enabled: v, provider: "brave" } })
            : undefined
        }
      />

      <ConfigRow
        icon={<MonitorSmartphone size={18} />}
        label="Browser"
        description="Navigate and interact with web pages"
        enabled={config?.browser?.enabled ?? false}
        onToggle={(v) => updateConfig({ browser: { enabled: v } })}
      />
    </div>
  );
}
