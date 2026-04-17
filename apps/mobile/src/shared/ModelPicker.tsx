import { useQuery } from "@apollo/client";
import { Check } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import type { IntegrationProvidersQuery } from "../graphql/generated/graphql";
import { AllEnabledModelsQuery, ProviderModelsQuery } from "../graphql/queries";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { BottomSheet } from "./BottomSheet";

type Provider = IntegrationProvidersQuery["integrationProviders"][number];

interface ModelOption {
  key: string;
  label: string;
  section: string;
  value: { type: string; modelId?: string; connectionId?: string };
}

export interface ModelPickerProps {
  visible: boolean;
  model?: {
    type: string;
    modelId?: string | null;
    connectionId?: string | null;
  } | null;
  providers: Provider[];
  mode?: "chat" | "image_generation" | "audio_speech";
  onSelect: (value: {
    type: string;
    modelId?: string;
    connectionId?: string;
  }) => void;
  onSelectDefault?: () => void;
  defaultLabel?: string;
  isUsingDefault?: boolean;
  onDismiss: () => void;
}

export function ModelPicker({
  visible,
  model,
  providers,
  mode,
  onSelect,
  onSelectDefault,
  defaultLabel,
  isUsingDefault,
  onDismiss,
}: ModelPickerProps) {
  const colors = useNavigationTheme();
  const { data: enabledData } = useQuery(AllEnabledModelsQuery);
  const { data: bedrockAvailable } = useQuery(ProviderModelsQuery, {
    variables: { providerId: "bedrock" },
  });

  const allEnabled = enabledData?.allEnabledModels ?? [];
  const bedrockAvailableModels = bedrockAvailable?.providerModels ?? [];

  const options: ModelOption[] = [];

  const bedrockEnabled = allEnabled.filter(
    (e) => e.providerId === "bedrock" && (!mode || e.modelMode === mode),
  );
  for (const entry of bedrockEnabled) {
    const info = bedrockAvailableModels.find((m) => m.id === entry.modelId);
    options.push({
      key: `bedrock:${entry.modelId}`,
      label: info?.name ?? entry.modelId,
      section: "Bedrock",
      value: { type: "bedrock", modelId: entry.modelId },
    });
  }

  const apiProviders = providers.filter(
    (p) => p.category === "ai" && p.id !== "bedrock" && p.hasConnection,
  );
  for (const provider of apiProviders) {
    const providerEnabled = allEnabled.filter(
      (e) => e.providerId === provider.id && (!mode || e.modelMode === mode),
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
    <BottomSheet visible={visible} title="Choose Model" onDismiss={onDismiss}>
      {options.length === 0 && !onSelectDefault ? (
        <View className="py-12 items-center">
          <Text className="text-sm text-text-muted">No models available</Text>
        </View>
      ) : (
        <FlatList
          data={options}
          keyExtractor={(item) => item.key}
          contentContainerClassName="pb-6"
          ListHeaderComponent={
            onSelectDefault ? (
              <Pressable
                onPress={() => {
                  onSelectDefault();
                  onDismiss();
                }}
                className="flex-row items-center justify-between px-4 py-3 active:bg-surface-alt"
              >
                <Text
                  className={`text-sm ${isUsingDefault ? "text-indigo-300" : "text-text-secondary"}`}
                >
                  {defaultLabel ?? "Use default"}
                </Text>
                {isUsingDefault && (
                  <Check size={14} color={colors.accentIndicator} />
                )}
              </Pressable>
            ) : undefined
          }
          renderItem={({ item }) => {
            const showHeader = sectionStarts.has(item.key);
            const selected = !isUsingDefault && isSelected(item);
            return (
              <>
                {showHeader && (
                  <Text className="px-4 pt-3 pb-1.5 text-sm font-bold text-text-muted uppercase tracking-wider">
                    {item.section}
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    onDismiss();
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
    </BottomSheet>
  );
}
