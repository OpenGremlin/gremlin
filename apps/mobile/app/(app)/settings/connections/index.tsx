import { router, useFocusEffect } from "expo-router";
import { CircleCheck } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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

export default function IntegrationsScreen() {
  const providers = useQuery(IntegrationProvidersQuery);
  const connections = useQuery(IntegrationConnectionsQuery);
  const [search, setSearch] = useState("");

  useFocusEffect(
    // biome-ignore lint/correctness/useExhaustiveDependencies: refetch on screen focus only, not on every render
    useCallback(() => {
      providers.refetch();
      connections.refetch();
    }, []),
  );

  const loading = providers.loading || connections.loading;
  const error = providers.error || connections.error;

  const providerList = providers.data?.integrationProviders ?? [];
  const connectionList = connections.data?.integrationConnections ?? [];

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
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-5">
      <QueryResult loading={loading} error={error} />

      {!loading &&
        !error &&
        (() => {
          const defaultModel = providers.data?.defaultModel;
          const allProviders = providerList;
          const aiProviders = allProviders.filter((p) => p.category === "ai");

          if (defaultModel) {
            const modelProvider = allProviders.find(
              (p) => p.id === defaultModel.providerId,
            );
            return (
              <Card className="p-4">
                <Text className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Default Model
                </Text>
                <Text className="text-sm font-medium text-text-primary">
                  {defaultModel.modelId}
                </Text>
                {modelProvider && (
                  <Text className="text-xs text-text-muted mt-0.5">
                    {modelProvider.service}
                  </Text>
                )}
              </Card>
            );
          }

          if (aiProviders.length > 0) {
            return (
              <Card className="p-4">
                <Text className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Default Model
                </Text>
                <Text className="text-sm text-text-muted">
                  No default model selected. Using Bedrock Claude Sonnet 4.
                </Text>
              </Card>
            );
          }

          return null;
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
                onPress={() => router.push(`/settings/connections/${conn.id}`)}
                className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-alt ${i > 0 ? "border-t border-app-border" : ""}`}
              >
                <IntegrationLogo id={conn.providerId} size={24} />
                <View className="flex-1 min-w-0">
                  <Text
                    className="text-sm font-medium text-text-primary"
                    numberOfLines={1}
                  >
                    {conn.meta.accountId && conn.meta.accountId !== "unknown"
                      ? conn.meta.accountId
                      : conn.provider.service}
                  </Text>
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
              const connected =
                provider.connectionType === "bedrock" ||
                provider.connectionCount > 0;
              return (
                <Pressable
                  key={provider.id}
                  onPress={() =>
                    router.push(`/settings/connections/provider/${provider.id}`)
                  }
                  className={`items-center gap-1.5 bg-surface rounded-xl px-3 py-3 active:bg-surface-alt ${
                    connected
                      ? "border-2 border-emerald-500"
                      : "border border-app-border"
                  }`}
                  style={{ width: "31.3%" }}
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
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
