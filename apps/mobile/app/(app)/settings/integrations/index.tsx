import { router } from "expo-router";
import { CircleCheck } from "lucide-react-native";
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

function ConnectionCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return <Text className="text-xs text-text-muted">Connect</Text>;
  }
  return (
    <View className="flex-row items-center gap-1">
      <CircleCheck size={12} color="#059669" />
      <Text className="text-xs text-emerald-600">
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
            const model = modelProvider?.models?.find(
              (m) => m.id === defaultModel.modelId,
            );
            return (
              <Card className="p-4">
                <Text className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                  Default Model
                </Text>
                <Text className="text-sm font-medium text-text-primary">
                  {model?.name ?? defaultModel.modelId}
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
          {connectionList.map((conn) => (
            <Pressable
              key={conn.id}
              onPress={() => router.push(`/settings/connections/${conn.id}`)}
              className="flex-row items-center gap-3 bg-surface border border-app-border rounded-xl p-4 active:bg-surface-alt"
            >
              <IntegrationLogo id={conn.providerId} size={32} />
              <View className="flex-1 min-w-0">
                <Text
                  className="text-sm font-medium text-text-primary"
                  numberOfLines={1}
                >
                  {conn.description}
                </Text>
                <Text className="text-xs text-text-muted" numberOfLines={1}>
                  {conn.providerId} ·{" "}
                  {conn.connectionType === "oauth"
                    ? "OAuth"
                    : conn.connectionType === "apikey"
                      ? "API Key"
                      : conn.connectionType}
                </Text>
              </View>
              <Text className="text-xs text-text-muted shrink-0">
                {formatDate(conn.connectedAt)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {connectionList.length > 0 && (
        <View className="border-b border-app-border" />
      )}

      {grouped.map((group) => (
        <View key={group.category} className="gap-2">
          <Text className="text-xs font-medium text-text-muted uppercase tracking-wider">
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
                  router.push(`/settings/integrations/${provider.id}`)
                }
                className={`flex-row items-center gap-3 bg-surface rounded-xl p-4 active:bg-surface-alt ${
                  connected
                    ? "border-2 border-emerald-500"
                    : "border border-app-border"
                }`}
              >
                <IntegrationLogo id={provider.id} size={36} />
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium text-text-primary">
                    {provider.service}
                  </Text>
                  <Text
                    className="text-xs text-text-muted mt-0.5"
                    numberOfLines={1}
                  >
                    {provider.description}
                  </Text>
                  <View className="mt-1">
                    {provider.connectionType === "bedrock" ? (
                      <View className="flex-row items-center gap-1">
                        <CircleCheck size={12} color="#059669" />
                        <Text className="text-xs text-emerald-600">
                          Connected
                        </Text>
                      </View>
                    ) : (
                      <ConnectionCountBadge count={provider.connectionCount} />
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
