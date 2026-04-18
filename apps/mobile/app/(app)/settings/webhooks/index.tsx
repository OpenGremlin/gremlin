import { useQuery } from "@apollo/client";
import { router, useFocusEffect } from "expo-router";
import { ChevronRight, Plus, Webhook } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { WebhooksQuery } from "../../../../src/graphql/queries";
import { useListRefresh } from "../../../../src/hooks/useListRefresh";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { Button } from "../../../../src/shared/Button";
import { Card } from "../../../../src/shared/Card";
import { EmptyState } from "../../../../src/shared/EmptyState";
import { formatTime } from "../../../../src/shared/formatDate";
import { QueryGate } from "../../../../src/shared/QueryResult";
import { TabScrollView } from "../../../../src/shared/TabScrollView";

export default function WebhooksScreen() {
  const colors = useNavigationTheme();
  const { data, loading, error, refetch } = useQuery(WebhooksQuery);
  const { refreshing, onRefresh } = useListRefresh(refetch);

  useFocusEffect(
    // biome-ignore lint/correctness/useExhaustiveDependencies: refetch on focus only
    useCallback(() => {
      refetch();
    }, []),
  );

  const webhooks = (data?.webhooks ?? []).filter((w) => !w.revokedAt);

  return (
    <QueryGate loading={loading} error={error} data={data}>
      <TabScrollView
        contentContainerClassName="px-4 pt-4 gap-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.loadingIndicator}
          />
        }
      >
        {webhooks.length === 0 ? (
          <EmptyState
            icon={<Webhook size={32} color={colors.iconMuted} />}
            message="No webhooks yet"
            description="Create a webhook to let an external service push events into Gremlin."
            actionLabel="Create webhook"
            onAction={() => router.push("/settings/webhooks/new")}
          />
        ) : (
          <>
            <Card className="overflow-hidden">
              {webhooks.map((wh, i) => {
                const activeKeys = wh.keys.filter((k) => !k.revokedAt).length;
                return (
                  <Pressable
                    key={wh.id}
                    onPress={() => router.push(`/settings/webhooks/${wh.id}`)}
                    className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-alt ${
                      i > 0 ? "border-t border-app-border" : ""
                    }`}
                  >
                    <View className="w-8 h-8 rounded-lg bg-accent-surface items-center justify-center">
                      <Webhook size={16} color={colors.accent} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text
                        className="text-base font-medium text-text-primary"
                        numberOfLines={1}
                      >
                        {wh.name}
                      </Text>
                      <Text
                        className="text-sm text-text-muted"
                        numberOfLines={1}
                      >
                        {wh.scopes.join(", ")}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-text-muted">
                        {wh.lastEventAt
                          ? `Used ${formatTime(wh.lastEventAt)}`
                          : "Never used"}
                      </Text>
                      <Text className="text-xs text-text-faint">
                        {activeKeys} {activeKeys === 1 ? "key" : "keys"}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.iconDefault} />
                  </Pressable>
                );
              })}
            </Card>
            <Button
              onPress={() => router.push("/settings/webhooks/new")}
              variant="secondary"
              size="lg"
              icon={<Plus size={18} color={colors.accent} />}
            >
              Create webhook
            </Button>
          </>
        )}
      </TabScrollView>
    </QueryGate>
  );
}
