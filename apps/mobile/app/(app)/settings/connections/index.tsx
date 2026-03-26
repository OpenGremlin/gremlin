import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CircleCheck } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  IntegrationConnectionsQuery,
  IntegrationProvidersQuery,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { Card } from "../../../../src/shared/Card";
import { groupByCategory } from "../../../../src/shared/categories";
import { formatDate } from "../../../../src/shared/formatDate";
import { IntegrationLogo } from "../../../../src/shared/IntegrationLogo";
import { QueryResult } from "../../../../src/shared/QueryResult";
import { SearchInput } from "../../../../src/shared/SearchInput";
import { Toast } from "../../../../src/shared/Toast";

function ConnectionCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return <Text className="text-[10px] text-text-muted">Connect</Text>;
  }
  return (
    <View className="flex-row items-center gap-1">
      <CircleCheck size={10} color="#059669" />
      <Text className="text-[10px] text-emerald-600">
        {count > 1 ? `${count} ` : ""}Connected
      </Text>
    </View>
  );
}

function HighlightableProviderTile({
  provider,
  connected,
  highlighted,
  children,
}: {
  provider: { id: string };
  connected: boolean;
  highlighted: boolean;
  children: React.ReactNode;
}) {
  const highlightOpacity = useSharedValue(0);

  useEffect(() => {
    if (highlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1500, withTiming(0, { duration: 800 })),
      );
    }
  }, [highlighted, highlightOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowColor: "#10b981",
    shadowOpacity: highlightOpacity.value * 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: highlightOpacity.value > 0 ? 8 : 0,
  }));

  return (
    <Animated.View style={[{ width: "31.3%" }, animatedStyle]}>
      <Pressable
        onPress={() =>
          router.push(`/settings/connections/provider/${provider.id}`)
        }
        className={`items-center gap-1.5 bg-surface rounded-xl px-3 py-3 active:bg-surface-alt ${
          connected ? "border-2 border-emerald-500" : "border border-app-border"
        }`}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function IntegrationsScreen() {
  const { connected: connectedParam } = useLocalSearchParams<{
    connected?: string;
  }>();
  const providers = useQuery(IntegrationProvidersQuery);
  const connections = useQuery(IntegrationConnectionsQuery);
  const [search, setSearch] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [highlightedProvider, setHighlightedProvider] = useState<string | null>(
    null,
  );
  const processedParam = useRef<string | null>(null);

  const loading = providers.loading || connections.loading;
  const error = providers.error || connections.error;

  const providerList = providers.data?.integrationProviders ?? [];
  const connectionList = connections.data?.integrationConnections ?? [];

  useEffect(() => {
    if (
      connectedParam &&
      connectedParam !== processedParam.current &&
      providerList.length > 0
    ) {
      processedParam.current = connectedParam;
      const provider = providerList.find((p) => p.id === connectedParam);
      const name = provider?.service ?? connectedParam;
      setToastMessage(`${name} connected successfully`);
      setToastVisible(true);
      setHighlightedProvider(connectedParam);
      const timer = setTimeout(() => setHighlightedProvider(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [connectedParam, providerList]);

  useFocusEffect(
    // biome-ignore lint/correctness/useExhaustiveDependencies: refetch on screen focus only, not on every render
    useCallback(() => {
      providers.refetch();
      connections.refetch();
    }, []),
  );

  const query = search.toLowerCase().trim();

  const filteredProviders = useMemo(
    () =>
      query
        ? providerList.filter((p) => p.service.toLowerCase().includes(query))
        : providerList,
    [providerList, query],
  );

  const grouped = groupByCategory(filteredProviders);

  return (
    <View className="flex-1">
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-5"
      >
        <QueryResult loading={loading} error={error} />

        {!loading &&
          !error &&
          (() => {
            const defaultModel = providers.data?.defaultModel;
            const defaultImageModel = providers.data?.defaultImageModel;
            const allProviders = providerList;
            const aiProviders = allProviders.filter((p) => p.category === "ai");

            if (
              !defaultModel &&
              !defaultImageModel &&
              aiProviders.length === 0
            ) {
              return null;
            }

            const defaults = [
              {
                label: "Language Model",
                model: defaultModel,
                fallback: "Using Bedrock Claude Sonnet 4",
              },
              {
                label: "Image Model",
                model: defaultImageModel,
                fallback: null,
              },
            ];

            return (
              <View className="gap-2">
                <Text className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Default Models
                </Text>
                {defaults.map(({ label, model, fallback }) => {
                  if (!model && !fallback) return null;
                  const modelProvider = model
                    ? allProviders.find((p) => p.id === model.providerId)
                    : null;
                  return (
                    <Card
                      key={label}
                      className="p-4 flex-row items-center gap-3"
                    >
                      {modelProvider && (
                        <IntegrationLogo id={modelProvider.id} size={32} />
                      )}
                      <View className="flex-1">
                        {model ? (
                          <>
                            {model.modelName && (
                              <Text className="text-sm font-medium text-text-primary">
                                {model.modelName}
                              </Text>
                            )}
                            <Text
                              className={`text-xs ${model.modelName ? "text-text-muted" : "text-sm font-medium text-text-primary"} mt-0.5`}
                            >
                              {model.modelId}
                            </Text>
                            <Text className="text-xs text-text-secondary mt-0.5">
                              {label}
                              {modelProvider
                                ? ` · ${modelProvider.service}`
                                : ""}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text className="text-sm text-text-muted">
                              {fallback}
                            </Text>
                            <Text className="text-xs text-text-secondary mt-0.5">
                              {label}
                            </Text>
                          </>
                        )}
                      </View>
                    </Card>
                  );
                })}
              </View>
            );
          })()}

        {connectionList.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Connections
            </Text>
            <Card className="overflow-hidden">
              {connectionList.map((conn, i) => (
                <Pressable
                  key={conn.id}
                  onPress={() =>
                    router.push(`/settings/connections/${conn.id}`)
                  }
                  className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-alt ${i > 0 ? "border-t border-app-border" : ""}`}
                >
                  <IntegrationLogo id={conn.providerId} size={24} />
                  <View className="flex-1 min-w-0">
                    <Text
                      className="text-sm font-medium text-text-primary"
                      numberOfLines={1}
                    >
                      {conn.provider.service}
                    </Text>
                    {conn.meta.accountId &&
                      conn.meta.accountId !== "unknown" && (
                        <Text
                          className="text-xs text-text-secondary"
                          numberOfLines={1}
                        >
                          {conn.meta.accountId}
                        </Text>
                      )}
                  </View>
                  <Text className="text-xs text-text-muted" numberOfLines={1}>
                    {formatDate(conn.connectedAt)}
                  </Text>
                </Pressable>
              ))}
            </Card>
          </View>
        )}

        {connectionList.length > 0 && (
          <View className="border-b border-app-border" />
        )}

        {!loading && !error && (
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search providers..."
          />
        )}

        {grouped.map((group) => (
          <View key={group.category} className="gap-2">
            <Text className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {group.label}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {group.items.map((provider) => {
                const isConnected =
                  provider.connectionType === "bedrock" ||
                  provider.connectionCount > 0;
                return (
                  <HighlightableProviderTile
                    key={provider.id}
                    provider={provider}
                    connected={isConnected}
                    highlighted={highlightedProvider === provider.id}
                  >
                    <IntegrationLogo id={provider.id} size={28} />
                    <Text
                      className="text-xs font-medium text-text-primary text-center"
                      numberOfLines={1}
                    >
                      {provider.service}
                    </Text>
                    {provider.connectionType === "bedrock" ? (
                      <View className="flex-row items-center gap-1">
                        <CircleCheck size={10} color="#059669" />
                        <Text className="text-[10px] text-emerald-600">
                          Connected
                        </Text>
                      </View>
                    ) : (
                      <ConnectionCountBadge count={provider.connectionCount} />
                    )}
                  </HighlightableProviderTile>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
