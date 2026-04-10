import { useQuery } from "@apollo/client";
import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import type { IntegrationProvidersQuery } from "../../src/graphql/generated/graphql";
import {
  AllEnabledModelsQuery,
  ProviderModelsQuery,
} from "../../src/graphql/queries";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";
import { Sheet } from "../../src/shared/Sheet";

type Provider = IntegrationProvidersQuery["integrationProviders"][number];

interface ModelOption {
  key: string;
  label: string;
  section: string;
  value: { type: string; modelId?: string; connectionId?: string };
}

export interface ModelPickerSheetPayload {
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
}

export default function ModelPickerSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<ModelPickerSheetPayload>(id);
  const colors = useNavigationTheme();
  const { data: enabledData } = useQuery(AllEnabledModelsQuery);
  const { data: bedrockAvailable } = useQuery(ProviderModelsQuery, {
    variables: { providerId: "bedrock" },
  });

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  if (!payload) return null;

  const { model, providers, mode, onSelect, onSelectDefault } = payload;
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
    <Sheet title="Choose Model">
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
                  router.back();
                }}
                className="flex-row items-center justify-between px-4 py-3 active:bg-surface-alt"
              >
                <Text
                  className={`text-sm ${payload.isUsingDefault ? "text-indigo-300" : "text-text-secondary"}`}
                >
                  {payload.defaultLabel ?? "Use default"}
                </Text>
                {payload.isUsingDefault && (
                  <Check size={14} color={colors.accentIndicator} />
                )}
              </Pressable>
            ) : undefined
          }
          renderItem={({ item }) => {
            const showHeader = sectionStarts.has(item.key);
            const selected = !payload.isUsingDefault && isSelected(item);
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
                    router.back();
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
    </Sheet>
  );
}
