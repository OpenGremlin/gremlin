import { useQuery } from "@apollo/client";
import { router, useFocusEffect } from "expo-router";
import {
  CircleCheck,
  MessageSquare,
  Mic,
  Paintbrush,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  AllEnabledModelsQuery,
  EnabledModelDetailsQuery,
  IntegrationProvidersQuery,
  SetDefaultImageModelMutation,
  SetDefaultModelMutation,
  SetDefaultSpeechModelMutation,
} from "../../../../src/graphql/queries";
import { execute } from "../../../../src/lib/apolloClient";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { Button } from "../../../../src/shared/Button";
import { Card } from "../../../../src/shared/Card";
import { Chip } from "../../../../src/shared/Chip";
import { IntegrationLogo } from "../../../../src/shared/IntegrationLogo";
import type { ModelDetail } from "../../../../src/shared/ModelDetailModal";
import { ModelDetailModal } from "../../../../src/shared/ModelDetailModal";
import { QueryResult } from "../../../../src/shared/QueryResult";
import { SearchInput } from "../../../../src/shared/SearchInput";

const MODE_ICON = {
  chat: MessageSquare,
  image_generation: Paintbrush,
  audio_speech: Mic,
} as const;

export default function ModelsScreen() {
  const colors = useNavigationTheme();
  const providers = useQuery(IntegrationProvidersQuery);
  const allEnabled = useQuery(AllEnabledModelsQuery);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState<{
    detail: ModelDetail;
    providerId: string;
  } | null>(null);

  const loading = providers.loading || allEnabled.loading;
  const error = providers.error || allEnabled.error;

  const providerList = providers.data?.integrationProviders ?? [];
  const defaultModel = providers.data?.defaultModel ?? null;
  const defaultImageModel = providers.data?.defaultImageModel ?? null;
  const defaultSpeechModel = providers.data?.defaultSpeechModel ?? null;
  const enabledModels = allEnabled.data?.allEnabledModels ?? [];

  useFocusEffect(
    // biome-ignore lint/correctness/useExhaustiveDependencies: refetch on screen focus only
    useCallback(() => {
      providers.refetch();
      allEnabled.refetch();
    }, []),
  );

  const aiProviders = useMemo(
    () =>
      providerList
        .filter((p) => p.category === "ai")
        .sort((a, b) => {
          if (a.id === "bedrock") return -1;
          if (b.id === "bedrock") return 1;
          return 0;
        }),
    [providerList],
  );

  const query = search.toLowerCase().trim();
  const filteredProviders = useMemo(
    () =>
      query
        ? aiProviders.filter((p) => p.service.toLowerCase().includes(query))
        : aiProviders,
    [aiProviders, query],
  );

  const grouped = useMemo(() => {
    const byProvider = new Map<
      string,
      { providerId: string; models: typeof enabledModels }
    >();
    for (const m of enabledModels) {
      let group = byProvider.get(m.providerId);
      if (!group) {
        group = { providerId: m.providerId, models: [] };
        byProvider.set(m.providerId, group);
      }
      group.models.push(m);
    }
    return [...byProvider.values()];
  }, [enabledModels]);

  async function handleModelPress(providerId: string, modelId: string) {
    try {
      const result = await execute(EnabledModelDetailsQuery, { providerId });
      const detail = result.enabledModelDetails.find((m) => m.id === modelId);
      if (detail) setSelectedModel({ detail, providerId });
    } catch {
      // silently fail
    }
  }

  const [defaultError, setDefaultError] = useState<string | null>(null);

  async function handleSetDefault(
    providerId: string,
    modelId: string,
    mode: string,
  ) {
    setDefaultError(null);
    try {
      const vars = { providerId, modelId };
      if (mode === "image_generation") {
        await execute(SetDefaultImageModelMutation, vars);
      } else if (mode === "audio_speech") {
        await execute(SetDefaultSpeechModelMutation, vars);
      } else {
        await execute(SetDefaultModelMutation, vars);
      }
      providers.refetch();
      setSelectedModel(null);
    } catch (err) {
      setDefaultError(
        err instanceof Error ? err.message : "Failed to set default",
      );
    }
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-5"
      >
        <QueryResult loading={loading} error={error} />

        {!loading && !error && grouped.length > 0 && (
          <View className="gap-2">
            <Card className="overflow-hidden">
              {grouped.map((group, gi) => {
                const provider = providerList.find(
                  (p) => p.id === group.providerId,
                );
                return (
                  <View
                    key={group.providerId}
                    className={`flex-row px-4 py-3 gap-3 ${gi > 0 ? "border-t border-app-border" : ""}`}
                  >
                    <View className="pt-0.5">
                      <IntegrationLogo id={group.providerId} size={28} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                        {provider?.service ?? group.providerId}
                      </Text>
                      {group.models.map((model) => {
                        const isDefaultLLM =
                          defaultModel?.providerId === model.providerId &&
                          defaultModel?.modelId === model.modelId;
                        const isDefaultImage =
                          defaultImageModel?.providerId === model.providerId &&
                          defaultImageModel?.modelId === model.modelId;
                        const isDefaultSpeech =
                          defaultSpeechModel?.providerId === model.providerId &&
                          defaultSpeechModel?.modelId === model.modelId;
                        return (
                          <Pressable
                            key={model.modelId}
                            onPress={() =>
                              handleModelPress(model.providerId, model.modelId)
                            }
                            className="flex-row items-center py-1 active:opacity-70"
                          >
                            {(() => {
                              const ModeIcon =
                                MODE_ICON[
                                  model.modelMode as keyof typeof MODE_ICON
                                ];
                              return ModeIcon ? (
                                <View style={{ marginRight: 8 }}>
                                  <ModeIcon
                                    size={12}
                                    color={colors.iconMuted}
                                  />
                                </View>
                              ) : null;
                            })()}
                            <Text className="text-sm text-text-primary">
                              {model.modelName ?? model.modelId}
                            </Text>
                            {(isDefaultLLM ||
                              isDefaultImage ||
                              isDefaultSpeech) && (
                              <Chip label="Default" className="ml-2" />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {!loading && !error && grouped.length === 0 && (
          <Card className="p-5">
            <Text className="text-sm text-text-muted text-center">
              No models enabled yet. Add a provider below to get started.
            </Text>
          </Card>
        )}

        {!loading && !error && (
          <>
            <View className="border-b border-app-border" />

            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search providers..."
            />

            <View className="gap-2">
              <Text className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Model Providers
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {filteredProviders.map((provider) => {
                  const isConnected =
                    provider.connectionType === "bedrock" ||
                    provider.connectionCount > 0;
                  return (
                    <Pressable
                      key={provider.id}
                      onPress={() =>
                        router.push(`/settings/models/provider/${provider.id}`)
                      }
                      style={{ width: "31.3%" }}
                      className={`items-center gap-1.5 bg-surface rounded-xl px-3 py-3 active:bg-surface-alt ${
                        isConnected
                          ? "border-2 border-emerald-500"
                          : "border border-app-border"
                      }`}
                    >
                      <IntegrationLogo id={provider.id} size={28} />
                      <Text
                        className="text-xs font-medium text-text-primary text-center"
                        numberOfLines={1}
                      >
                        {provider.service}
                      </Text>
                      {isConnected ? (
                        <View className="flex-row items-center gap-1">
                          <CircleCheck size={10} color="#059669" />
                          <Text className="text-[10px] text-emerald-600">
                            Connected
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-[10px] text-text-muted">
                          Connect
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <ModelDetailModal
        model={selectedModel?.detail ?? null}
        onClose={() => setSelectedModel(null)}
        actions={(model) => {
          if (!selectedModel) return null;
          const isDefaultLLM =
            defaultModel?.providerId === selectedModel.providerId &&
            defaultModel?.modelId === model.id;
          const isDefaultImage =
            defaultImageModel?.providerId === selectedModel.providerId &&
            defaultImageModel?.modelId === model.id;
          const isDefaultSpeech =
            defaultSpeechModel?.providerId === selectedModel.providerId &&
            defaultSpeechModel?.modelId === model.id;
          const isDefault = isDefaultLLM || isDefaultImage || isDefaultSpeech;
          if (isDefault) return null;
          return (
            <View className="gap-2">
              {defaultError && (
                <Text className="text-sm text-red-400 text-center">
                  {defaultError}
                </Text>
              )}
              <Button
                onPress={() =>
                  handleSetDefault(
                    selectedModel.providerId,
                    model.id,
                    model.mode,
                  )
                }
                fullWidth
              >
                {model.mode === "image_generation"
                  ? "Set as Default Image"
                  : model.mode === "audio_speech"
                    ? "Set as Default Speech"
                    : "Set as Default LLM"}
              </Button>
            </View>
          );
        }}
      />
    </View>
  );
}
