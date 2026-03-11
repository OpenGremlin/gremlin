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
    "text-xl font-semibold text-neutral-100 bg-transparent border-b border-neutral-600 py-1";

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
            <Text className="text-xl font-semibold text-neutral-100">
              {description}
            </Text>
          </Pressable>
        )}
        {accountId ? (
          <Text className="text-sm text-neutral-400 mt-0.5">{accountId}</Text>
        ) : null}
        <Text className="text-xs text-neutral-500 mt-0.5">
          Connected {formatDate(connection.connectedAt)}
        </Text>
      </View>

      {scopes && scopes.length > 0 && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-neutral-100">
            Granted Scopes
          </Text>
          {scopes.map((scope) => (
            <View key={scope} className="bg-neutral-900 rounded-xl p-4">
              <Text className="text-sm text-neutral-100">{scope}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-100">Details</Text>
        <View className="bg-neutral-900 rounded-xl p-4 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-neutral-400">Provider</Text>
            <Text className="text-sm text-neutral-100">
              {connection.providerId}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-neutral-400">Type</Text>
            <Text className="text-sm text-neutral-100">
              {connection.connectionType}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleRevoke}
        disabled={revoking}
        className="self-start px-4 py-2 disabled:opacity-50"
      >
        <Text className="text-sm text-red-400">
          {revoking ? "Revoking..." : "Revoke Connection"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
