import { router } from "expo-router";
import { CircleCheck } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  IntegrationConnectionsQuery,
  IntegrationProvidersQuery,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { groupByCategory } from "../../../../src/shared/categories";
import { formatDate } from "../../../../src/shared/formatDate";
import { QueryResult } from "../../../../src/shared/QueryResult";

function ConnectionCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return <Text className="text-xs text-neutral-500">Connect</Text>;
  }
  return (
    <View className="flex-row items-center gap-1">
      <CircleCheck size={12} color="#34d399" />
      <Text className="text-xs text-emerald-400">
        {count > 1 ? `${count} ` : ""}Connected
      </Text>
    </View>
  );
}

export default function IntegrationsScreen() {
  const providers = useQuery(IntegrationProvidersQuery);
  const connections = useQuery(IntegrationConnectionsQuery);

  const loading = providers.loading || connections.loading;
  const error = providers.error || connections.error;

  const providerList = providers.data?.integrationProviders ?? [];
  const connectionList = connections.data?.integrationConnections ?? [];

  const grouped = groupByCategory(providerList);

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-5">
      <QueryResult loading={loading} error={error} />

      {connectionList.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Connections
          </Text>
          {connectionList.map((conn) => (
            <Pressable
              key={conn.id}
              onPress={() =>
                router.push(`/(app)/(settings)/connections/${conn.id}`)
              }
              className="flex-row items-center gap-3 bg-neutral-900 rounded-xl p-4 active:bg-neutral-800"
            >
              <View className="flex-1 min-w-0">
                <Text
                  className="text-sm font-medium text-neutral-100"
                  numberOfLines={1}
                >
                  {conn.description}
                </Text>
                <Text className="text-xs text-neutral-400" numberOfLines={1}>
                  {conn.providerId} ·{" "}
                  {conn.connectionType === "oauth"
                    ? "OAuth"
                    : conn.connectionType === "apikey"
                      ? "API Key"
                      : conn.connectionType}
                </Text>
              </View>
              <Text className="text-xs text-neutral-500 shrink-0">
                {formatDate(conn.connectedAt)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {connectionList.length > 0 && (
        <View className="border-b border-neutral-800" />
      )}

      {grouped.map((group) => (
        <View key={group.category} className="gap-2">
          <Text className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            {group.label}
          </Text>
          {group.items.map((provider) => {
            const connected =
              provider.connectionType === "bedrock" ||
              provider.connectionCount > 0;
            return (
              <Pressable
                key={provider.id}
                onPress={() =>
                  router.push(`/(app)/(settings)/integrations/${provider.id}`)
                }
                className={`bg-neutral-900 rounded-xl p-4 active:bg-neutral-800 ${
                  connected ? "border border-emerald-500/40" : ""
                }`}
              >
                <Text className="text-sm font-medium text-neutral-100">
                  {provider.service}
                </Text>
                <Text
                  className="text-xs text-neutral-400 mt-0.5"
                  numberOfLines={2}
                >
                  {provider.description}
                </Text>
                <View className="mt-2">
                  {provider.connectionType === "bedrock" ? (
                    <View className="flex-row items-center gap-1">
                      <CircleCheck size={12} color="#34d399" />
                      <Text className="text-xs text-emerald-400">
                        Connected
                      </Text>
                    </View>
                  ) : (
                    <ConnectionCountBadge count={provider.connectionCount} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
