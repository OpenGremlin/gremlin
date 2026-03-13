import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  IntegrationConnectionsQuery,
  RevokeConnectionMutation,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { gql } from "../../../../src/lib/auth";
import { Card } from "../../../../src/shared/Card";
import { ConfirmDialog } from "../../../../src/shared/ConfirmDialog";
import { DestructiveButton } from "../../../../src/shared/DestructiveButton";
import { formatDate } from "../../../../src/shared/formatDate";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

export default function ConnectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useQuery(IntegrationConnectionsQuery);
  const connection =
    data?.integrationConnections.find((c) => c.id === id) ?? null;

  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!connection) {
    return <NotFound label="Connection not found." />;
  }

  const meta = connection.meta;
  const accountId = meta.accountId ?? null;
  const scopes = meta.__typename === "OAuthConnectionMeta" ? meta.scopes : null;

  async function doRevoke() {
    setConfirmVisible(false);
    setRevoking(true);
    setRevokeError(null);
    try {
      await gql(RevokeConnectionMutation, { id: id ?? "" });
      router.back();
    } catch (err) {
      setRevokeError(
        err instanceof Error ? err.message : "Failed to revoke connection",
      );
      setRevoking(false);
    }
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-5"
    >
      {revokeError ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{revokeError}</Text>
        </View>
      ) : null}

      <View className="gap-1">
        <Text className="text-xl font-semibold text-text-primary">
          {accountId && accountId !== "unknown"
            ? accountId
            : connection.providerId}
        </Text>
        <Text className="text-xs text-text-muted mt-0.5">
          Connected {formatDate(connection.connectedAt)}
        </Text>
      </View>

      {scopes && scopes.length > 0 && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-text-primary">
            Granted Scopes
          </Text>
          {scopes.map((scope) => (
            <Card key={scope} className="p-4">
              <Text className="text-sm text-text-primary">{scope}</Text>
            </Card>
          ))}
        </View>
      )}

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-primary">Details</Text>
        <Card className="p-4 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-muted">Provider</Text>
            <Text className="text-sm text-text-primary">
              {connection.providerId}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-muted">Type</Text>
            <Text className="text-sm text-text-primary">
              {connection.connectionType}
            </Text>
          </View>
        </Card>
      </View>

      <DestructiveButton
        onPress={() => setConfirmVisible(true)}
        loading={revoking}
        label="Revoke Connection"
        loadingLabel="Revoking..."
        size="lg"
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Revoke Connection"
        message="Are you sure you want to revoke this connection?"
        confirmLabel="Revoke"
        destructive
        onConfirm={doRevoke}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScrollView>
  );
}
