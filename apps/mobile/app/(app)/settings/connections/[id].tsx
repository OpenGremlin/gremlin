import { useQuery } from "@apollo/client";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import {
  IntegrationConnectionsQuery,
  RevokeConnectionMutation,
} from "../../../../src/graphql/queries";
import { execute } from "../../../../src/lib/apolloClient";
import { Card } from "../../../../src/shared/Card";
import { ConfirmDialog } from "../../../../src/shared/ConfirmDialog";
import { DestructiveButton } from "../../../../src/shared/DestructiveButton";
import { ErrorBanner } from "../../../../src/shared/ErrorBanner";
import { formatDate } from "../../../../src/shared/formatDate";
import { IntegrationLogo } from "../../../../src/shared/IntegrationLogo";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";
import { TabScrollView } from "../../../../src/shared/TabScrollView";

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
  const scopes = meta.__typename === "OAuthConnectionMeta" ? meta.scopes : null;

  async function doRevoke() {
    setConfirmVisible(false);
    setRevoking(true);
    setRevokeError(null);
    try {
      await execute(RevokeConnectionMutation, { id: id ?? "" });
      router.back();
    } catch (err) {
      setRevokeError(
        err instanceof Error ? err.message : "Failed to revoke connection",
      );
      setRevoking(false);
    }
  }

  return (
    <TabScrollView contentContainerClassName="px-4 pt-6 gap-5">
      <ErrorBanner message={revokeError} />

      <View className="flex-row items-center gap-4">
        <IntegrationLogo id={connection.providerId} size={48} />
        <View className="flex-1">
          <Text className="text-xl font-semibold text-text-primary">
            {connection.provider.service}
          </Text>
          <Text className="text-sm text-text-muted mt-0.5">
            {connection.provider.description}
          </Text>
          <Text className="text-xs text-text-muted mt-0.5">
            Connected {formatDate(connection.connectedAt)}
          </Text>
        </View>
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
              {connection.provider.service}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-muted">Type</Text>
            <Text className="text-sm text-text-primary">
              {connection.connectionType === "oauth"
                ? "OAuth"
                : connection.connectionType === "apikey" ||
                    connection.connectionType === "model_provider"
                  ? "API Key"
                  : connection.connectionType === "aws_iam_role"
                    ? "IAM Role"
                    : connection.connectionType}
            </Text>
          </View>
          {meta.__typename === "AwsIamRoleConnectionMeta" && (
            <>
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-muted">Account ID</Text>
                <Text className="text-sm text-text-primary font-mono">
                  {meta.accountId}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-muted">Role</Text>
                <Text
                  className="text-sm text-text-primary font-mono"
                  numberOfLines={1}
                >
                  {meta.roleArn.split("/").pop()}
                </Text>
              </View>
              {meta.displayName && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-text-muted">Label</Text>
                  <Text className="text-sm text-text-primary">
                    {meta.displayName}
                  </Text>
                </View>
              )}
            </>
          )}
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
    </TabScrollView>
  );
}
