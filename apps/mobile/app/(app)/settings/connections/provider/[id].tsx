import { useQuery } from "@apollo/client";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import {
  ConnectApiKeyMutation,
  IntegrationProvidersQuery,
} from "../../../../../src/graphql/queries";
import { gql } from "../../../../../src/lib/auth";
import {
  connectOAuthProvider,
  isOAuthAvailable,
  type OAuthProviderConfig,
} from "../../../../../src/lib/oauth";
import { useNavigationTheme } from "../../../../../src/lib/useNavigationTheme";
import { Button } from "../../../../../src/shared/Button";
import { Card } from "../../../../../src/shared/Card";
import { Input } from "../../../../../src/shared/Input";
import { IntegrationLogo } from "../../../../../src/shared/IntegrationLogo";
import { NotFound, QueryResult } from "../../../../../src/shared/QueryResult";

function OAuthDetailView({
  provider,
}: {
  provider: OAuthProviderConfig & {
    service: string;
    hasConnection: boolean;
    availableScopes: ReadonlyArray<{ scope: string; label: string }>;
  };
}) {
  const colors = useNavigationTheme();
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    () => new Set(provider.availableScopes.map((s) => s.scope)),
  );
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleScope(scope: string) {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  async function handleConnect() {
    if (selectedScopes.size === 0) {
      setError("Select at least one scope.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await connectOAuthProvider(provider, [...selectedScopes]);
      router.navigate(
        `/settings/connections?connected=${encodeURIComponent(provider.id)}`,
      );
    } catch (err) {
      if (err instanceof Error && err.message === "OAuth flow was cancelled") {
        // User dismissed the browser — not an error
      } else {
        setError(err instanceof Error ? err.message : "Connection failed");
      }
    } finally {
      setConnecting(false);
    }
  }

  if (!isOAuthAvailable()) {
    return (
      <Card className="p-5">
        <Text className="text-sm text-text-muted">
          OAuth connections are only available on iOS and Android.
        </Text>
      </Card>
    );
  }

  if (!provider.defaultClientId) {
    return (
      <Card className="p-5">
        <Text className="text-sm text-text-muted">
          No OAuth client configured for this provider. Contact your server
          admin to set one up.
        </Text>
      </Card>
    );
  }

  return (
    <>
      {provider.hasConnection && (
        <Card className="p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-text-primary">
              {provider.service}
            </Text>
            <Text className="text-xs text-text-muted mt-0.5">Connected</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Text className="text-xs text-text-muted">Active</Text>
          </View>
        </Card>
      )}

      {provider.availableScopes.length > 0 && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-text-primary">Scopes</Text>
          {provider.availableScopes.map((s) => (
            <Pressable
              key={s.scope}
              onPress={() => toggleScope(s.scope)}
              disabled={connecting}
              className="flex-row items-center gap-3 bg-surface border border-app-border rounded-xl px-4 py-3 active:bg-surface-alt"
            >
              <Switch
                value={selectedScopes.has(s.scope)}
                onValueChange={() => toggleScope(s.scope)}
                disabled={connecting}
                trackColor={{
                  false: colors.border,
                  true: colors.accent,
                }}
              />
              <View className="flex-1">
                <Text className="text-sm text-text-primary">{s.label}</Text>
                <Text className="text-xs text-text-muted">{s.scope}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      <Button
        onPress={handleConnect}
        disabled={connecting}
        loading={connecting}
        fullWidth
      >
        {provider.hasConnection ? "Add Connection" : "Connect"}
      </Button>
    </>
  );
}

function ApiKeyDetailView({
  provider,
}: {
  provider: { id: string; service: string; hasConnection: boolean };
}) {
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (!apiKey.trim()) {
      setError("API key is required.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await gql(ConnectApiKeyMutation, {
        providerId: provider.id,
        apiKey: apiKey.trim(),
      });
      router.navigate(
        `/settings/connections?connected=${encodeURIComponent(provider.id)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <>
      {provider.hasConnection && (
        <Card className="p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-text-primary">
              {provider.service}
            </Text>
            <Text className="text-xs text-text-muted mt-0.5">Connected</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Text className="text-xs text-text-muted">Active</Text>
          </View>
        </Card>
      )}

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-primary">API Key</Text>
        <Input
          placeholder="Enter your API key"
          value={apiKey}
          onChangeText={setApiKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          onSubmitEditing={handleConnect}
        />
      </View>

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      <Button
        onPress={handleConnect}
        disabled={connecting}
        loading={connecting}
        fullWidth
      >
        {provider.hasConnection ? "Update API Key" : "Connect"}
      </Button>
    </>
  );
}

export default function ConnectionProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useQuery(IntegrationProvidersQuery);
  const provider = data?.integrationProviders.find((p) => p.id === id) ?? null;

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  if (!provider) {
    return <NotFound label="Integration not found." />;
  }

  // AI model providers should be managed on the Models page
  if (provider.category === "ai") {
    router.replace(`/settings/models/provider/${provider.id}`);
    return null;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center gap-4">
        <IntegrationLogo id={provider.id} size={48} />
        <View className="flex-1">
          <Text className="text-xl font-semibold text-text-primary">
            {provider.service}
          </Text>
          <Text className="text-sm text-text-muted mt-0.5">
            {provider.description}
          </Text>
        </View>
      </View>

      {provider.connectionType === "oauth" ? (
        <OAuthDetailView provider={provider} />
      ) : provider.connectionType === "apikey" ? (
        <ApiKeyDetailView provider={provider} />
      ) : provider.connectionType === "custom" ? (
        <Card className="p-5">
          <Text className="text-sm text-text-muted">
            This integration requires a custom connection flow that is not yet
            supported.
          </Text>
        </Card>
      ) : (
        <Card className="p-5">
          <Text className="text-sm text-text-muted">
            This connection type is not yet supported.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}
