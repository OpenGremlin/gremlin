import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  IntegrationConnectionsQuery,
  RenameConnectionMutation,
  RevokeConnectionMutation,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { gql } from "../../../../src/lib/auth";
import { Card } from "../../../../src/shared/Card";
import { DestructiveButton } from "../../../../src/shared/DestructiveButton";
import { formatDate } from "../../../../src/shared/formatDate";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

export default function ConnectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, refetch } = useQuery(
    IntegrationConnectionsQuery,
  );
  const connection =
    data?.integrationConnections.find((c) => c.id === id) ?? null;

  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!connection) {
    return <NotFound label="Connection not found." />;
  }

  const meta = connection.meta;
  const accountId = meta.accountId ?? null;
  const scopes = meta.__typename === "OAuthConnectionMeta" ? meta.scopes : null;
  const description = connection.description;

  function startEditing() {
    setEditValue(description);
    setEditing(true);
  }

  async function handleRename() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === description) {
      setEditing(false);
      return;
    }
    await gql(RenameConnectionMutation, { id: id ?? "", description: trimmed });
    setEditing(false);
    refetch();
  }

  function handleRevoke() {
    Alert.alert(
      "Revoke Connection",
      "Are you sure you want to revoke this connection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            setRevoking(true);
            setRevokeError(null);
            try {
              await gql(RevokeConnectionMutation, { id: id ?? "" });
              router.back();
            } catch (err) {
              setRevokeError(
                err instanceof Error
                  ? err.message
                  : "Failed to revoke connection",
              );
              setRevoking(false);
            }
          },
        },
      ],
    );
  }

  const inputClass =
    "text-xl font-semibold text-text-primary bg-transparent border-b border-app-border py-1";

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {revokeError ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{revokeError}</Text>
        </View>
      ) : null}

      <View className="gap-1">
        {editing ? (
          <TextInput
            className={inputClass}
            value={editValue}
            onChangeText={setEditValue}
            onBlur={() => handleRename()}
            onSubmitEditing={() => handleRename()}
            autoFocus
          />
        ) : (
          <Pressable onPress={startEditing}>
            <Text className="text-xl font-semibold text-text-primary">
              {description}
            </Text>
          </Pressable>
        )}
        {accountId ? (
          <Text className="text-sm text-text-muted mt-0.5">{accountId}</Text>
        ) : null}
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
            <Card
              key={scope}
              className="p-4"
            >
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
        onPress={handleRevoke}
        loading={revoking}
        label="Revoke Connection"
        loadingLabel="Revoking..."
        size="lg"
      />
    </ScrollView>
  );
}
