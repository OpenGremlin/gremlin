import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { IntegrationProvidersQuery } from "../../../graphql/generated/graphql";

type Provider = IntegrationProvidersQuery["integrationProviders"][number];

export function ModelPicker({
  model,
  providers,
  bedrockModels,
  onSelect,
}: {
  model?: {
    type: string;
    modelId?: string | null;
    connectionId?: string | null;
  } | null;
  providers: Provider[];
  bedrockModels: string[];
  onSelect: (value: {
    type: string;
    modelId?: string;
    connectionId?: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);

  // Bedrock provider with only enabled models
  const bedrockProvider = providers.find((p) => p.id === "bedrock");
  const bedrockEnabledModels = (bedrockProvider?.models ?? []).filter((m) =>
    bedrockModels.includes(m.id),
  );

  // API providers with connections and models
  const apiProviders = providers.filter(
    (p) =>
      p.category === "ai" &&
      p.id !== "bedrock" &&
      p.hasConnection &&
      p.models?.length,
  );

  // Find the currently selected label
  function getSelectedLabel(): string {
    if (!model) return "Select a model";
    if (model.type === "bedrock" && model.modelId) {
      const m = bedrockEnabledModels.find((m) => m.id === model.modelId);
      return m ? `Bedrock / ${m.name}` : `Bedrock / ${model.modelId}`;
    }
    if (model.type === "connection" && model.connectionId) {
      const [providerId, modelId] = model.connectionId.split(":", 2);
      const provider = apiProviders.find((p) => p.id === providerId);
      const m = provider?.models?.find((m) => m.id === modelId);
      return m
        ? `${provider?.service ?? providerId} / ${m.name}`
        : model.connectionId;
    }
    return "Select a model";
  }

  function isSelected(type: string, id: string, providerId?: string): boolean {
    if (!model) return false;
    if (type === "bedrock")
      return model.type === "bedrock" && model.modelId === id;
    return (
      model.type === "connection" &&
      model.connectionId === `${providerId}:${id}`
    );
  }

  const hasOptions = bedrockEnabledModels.length > 0 || apiProviders.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => hasOptions && setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-md text-neutral-200 hover:border-neutral-600 transition-colors"
      >
        <span className={model ? "" : "text-neutral-500"}>
          {hasOptions ? getSelectedLabel() : "No models connected"}
        </span>
        {hasOptions && (
          <ChevronDown
            size={14}
            className={`text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-neutral-900 border border-neutral-700 rounded-md shadow-xl max-h-72 overflow-y-auto">
            {bedrockEnabledModels.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Bedrock
                </div>
                {bedrockEnabledModels.map((m) => {
                  const selected = isSelected("bedrock", m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onSelect({ type: "bedrock", modelId: m.id });
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-neutral-800 ${selected ? "text-indigo-300" : "text-neutral-300"}`}
                    >
                      {m.name}
                      {selected && (
                        <Check size={14} className="text-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {apiProviders.map((provider) => (
              <div key={provider.id}>
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  {provider.service}
                </div>
                {provider.models?.map((m) => {
                  const selected = isSelected("connection", m.id, provider.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onSelect({
                          type: "connection",
                          connectionId: `${provider.id}:${m.id}`,
                        });
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-neutral-800 ${selected ? "text-indigo-300" : "text-neutral-300"}`}
                    >
                      {m.name}
                      {selected && (
                        <Check size={14} className="text-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
