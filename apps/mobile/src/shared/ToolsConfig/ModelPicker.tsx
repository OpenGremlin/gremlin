import { Check } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import type { IntegrationProvidersQuery } from "../../graphql/generated/graphql";
import {
  AllEnabledModelsQuery,
  BedrockAvailableModelsQuery,
} from "../../graphql/queries";
import { useQuery } from "../../hooks/useQuery";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { SheetModal } from "../SheetModal";

type Provider = IntegrationProvidersQuery["integrationProviders"][number];

interface ModelOption {
  key: string;
  label: string;
  section: string;
  value: { type: string; modelId?: string; connectionId?: string };
}

export function ModelPicker({
  model,
  providers,
  onSelect,
  onClose,
}: {
  model?: {
    type: string;
    modelId?: string | null;
    connectionId?: string | null;
  } | null;
  providers: Provider[];
  onSelect: (value: {
    type: string;
    modelId?: string;
    connectionId?: string;
  }) => void;
  onClose: () => void;
}) {
  const colors = useNavigationTheme();
  const { data: enabledData } = useQuery(AllEnabledModelsQuery);
  const { data: bedrockAvailable } = useQuery(BedrockAvailableModelsQuery);

  const allEnabled = enabledData?.allEnabledModels ?? [];
  const bedrockAvailableModels = bedrockAvailable?.bedrockAvailableModels ?? [];

  const options: ModelOption[] = [];

  // Bedrock enabled models — resolve names from available models list
  const bedrockEnabled = allEnabled.filter((e) => e.providerId === "bedrock");
  for (const entry of bedrockEnabled) {
    const info = bedrockAvailableModels.find((m) => m.id === entry.modelId);
    options.push({
      key: `bedrock:${entry.modelId}`,
      label: info?.name ?? entry.modelId,
      section: "Bedrock",
      value: { type: "bedrock", modelId: entry.modelId },
    });
  }

  // API-key provider enabled models
  const apiProviders = providers.filter(
    (p) => p.category === "ai" && p.id !== "bedrock" && p.hasConnection,
  );
  for (const provider of apiProviders) {
    const providerEnabled = allEnabled.filter(
      (e) => e.providerId === provider.id,
    );
    for (const entry of providerEnabled) {
      options.push({
        key: `${provider.id}:${entry.modelId}`,
        label: entry.modelName ?? entry.modelId,
        section: provider.service,
        value: {
          type: "connection",
          connectionId: `${provider.id}:${entry.modelId}`,
        },
      });
    }
  }

  function isSelected(opt: ModelOption): boolean {
    if (!model) return false;
    if (opt.value.type === "bedrock")
      return model.type === "bedrock" && model.modelId === opt.value.modelId;
    return (
      model.type === "connection" &&
      model.connectionId === opt.value.connectionId
    );
  }

  // Pre-compute which items start a new section
  const sectionStarts = new Set<string>();
  {
    let prev = "";
    for (const opt of options) {
      if (opt.section !== prev) {
        sectionStarts.add(opt.key);
        prev = opt.section;
      }
    }
  }

  return (
    <SheetModal visible title="Choose Model" onClose={onClose}>
      {options.length === 0 ? (
        <View className="py-12 items-center">
          <Text className="text-sm text-text-muted">No models available</Text>
        </View>
      ) : (
        <FlatList
          data={options}
          keyExtractor={(item) => item.key}
          contentContainerClassName="pb-6"
          renderItem={({ item }) => {
            const showHeader = sectionStarts.has(item.key);
            const selected = isSelected(item);
            return (
              <>
                {showHeader && (
                  <Text className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {item.section}
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                  className="flex-row items-center justify-between px-4 py-3 active:bg-surface-alt"
                >
                  <Text
                    className={`text-sm ${selected ? "text-indigo-300" : "text-text-secondary"}`}
                  >
                    {item.label}
                  </Text>
                  {selected && (
                    <Check size={14} color={colors.accentIndicator} />
                  )}
                </Pressable>
              </>
            );
          }}
        />
      )}
    </SheetModal>
  );
}
