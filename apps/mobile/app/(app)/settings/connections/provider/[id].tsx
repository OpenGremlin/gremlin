import { useQuery } from "@apollo/client";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { Copy } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import {
  AwsSetupQuery,
  ConnectApiKeyMutation,
  ConnectAwsIamRoleMutation,
  IntegrationProvidersQuery,
} from "../../../../../src/graphql/queries";
import { execute } from "../../../../../src/lib/apolloClient";
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
import {
  PickerModal,
  type PickerOption,
} from "../../../../../src/shared/PickerModal";
import { NotFound, QueryResult } from "../../../../../src/shared/QueryResult";
import { Toast } from "../../../../../src/shared/Toast";

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
      await execute(ConnectApiKeyMutation, {
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

const AWS_REGIONS: PickerOption[] = [
  { value: "", label: "None (use default)" },
  { value: "us-east-1", label: "us-east-1 — US East (N. Virginia)" },
  { value: "us-east-2", label: "us-east-2 — US East (Ohio)" },
  { value: "us-west-1", label: "us-west-1 — US West (N. California)" },
  { value: "us-west-2", label: "us-west-2 — US West (Oregon)" },
  { value: "eu-west-1", label: "eu-west-1 — Europe (Ireland)" },
  { value: "eu-west-2", label: "eu-west-2 — Europe (London)" },
  { value: "eu-west-3", label: "eu-west-3 — Europe (Paris)" },
  { value: "eu-central-1", label: "eu-central-1 — Europe (Frankfurt)" },
  { value: "eu-north-1", label: "eu-north-1 — Europe (Stockholm)" },
  {
    value: "ap-southeast-1",
    label: "ap-southeast-1 — Asia Pacific (Singapore)",
  },
  { value: "ap-southeast-2", label: "ap-southeast-2 — Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "ap-northeast-1 — Asia Pacific (Tokyo)" },
  { value: "ap-northeast-2", label: "ap-northeast-2 — Asia Pacific (Seoul)" },
  { value: "ap-south-1", label: "ap-south-1 — Asia Pacific (Mumbai)" },
  { value: "sa-east-1", label: "sa-east-1 — South America (Sao Paulo)" },
  { value: "ca-central-1", label: "ca-central-1 — Canada (Central)" },
  { value: "me-south-1", label: "me-south-1 — Middle East (Bahrain)" },
  { value: "af-south-1", label: "af-south-1 — Africa (Cape Town)" },
];

function AwsIamRoleDetailView({
  provider,
}: {
  provider: { id: string; service: string; hasConnection: boolean };
}) {
  const [tab, setTab] = useState<"this" | "remote">("this");
  const [roleArn, setRoleArn] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("");
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const { data: setupData, loading: presetsLoading } = useQuery(AwsSetupQuery);
  const presetRoles = setupData?.awsPresetRoles ?? [];
  const trustPolicy = setupData?.awsSetupInfo.trustPolicy ?? "";

  async function handleConnect(arn: string, name?: string, rgn?: string) {
    setConnecting(true);
    setError(null);
    try {
      await execute(ConnectAwsIamRoleMutation, {
        roleArn: arn,
        displayName: name,
        region: rgn,
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

  const copyTrustPolicy = useCallback(async () => {
    if (!trustPolicy) return;
    await Clipboard.setStringAsync(trustPolicy);
    setToastVisible(true);
  }, [trustPolicy]);

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

      {/* Tab selector */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setTab("this")}
          className={`flex-1 py-2.5 rounded-xl items-center border ${
            tab === "this"
              ? "bg-surface-alt border-accent"
              : "bg-surface border-app-border"
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              tab === "this" ? "text-accent" : "text-text-muted"
            }`}
          >
            This Account
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("remote")}
          className={`flex-1 py-2.5 rounded-xl items-center border ${
            tab === "remote"
              ? "bg-surface-alt border-accent"
              : "bg-surface border-app-border"
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              tab === "remote" ? "text-accent" : "text-text-muted"
            }`}
          >
            Remote Account
          </Text>
        </Pressable>
      </View>

      {tab === "this" ? (
        <View className="gap-3">
          <Text className="text-sm text-text-muted">
            Select a preset role to connect. These roles are pre-configured in
            your Gremlin AWS account.
          </Text>
          {presetsLoading ? (
            <Card className="p-5">
              <Text className="text-sm text-text-muted">
                Loading preset roles...
              </Text>
            </Card>
          ) : presetRoles.length === 0 ? (
            <Card className="p-5">
              <Text className="text-sm text-text-muted">
                No preset roles available. Deploy the PresetIamRolesStack first.
              </Text>
            </Card>
          ) : (
            presetRoles.map((role) => (
              <Card key={role.id} className="p-4 gap-2">
                <Text className="text-sm font-medium text-text-primary">
                  {role.name}
                </Text>
                <Text className="text-xs text-text-muted">
                  {role.description}
                </Text>
                <Button
                  onPress={() => handleConnect(role.roleArn, role.name)}
                  disabled={connecting}
                  loading={connecting}
                >
                  Connect
                </Button>
              </Card>
            ))
          )}
        </View>
      ) : (
        <View className="gap-4">
          <Text className="text-sm text-text-muted">
            Connect to an AWS account by providing a role ARN. The role must
            trust this Gremlin server to assume it.
          </Text>

          {/* Setup instructions */}
          <Card className="p-4 gap-3">
            <Text className="text-sm font-medium text-text-primary">
              Setup Instructions
            </Text>
            <Text className="text-xs text-text-muted">
              1. In your AWS account, go to IAM &gt; Roles &gt; Create Role
            </Text>
            <Text className="text-xs text-text-muted">
              2. Select "Custom trust policy" and paste this trust policy:
            </Text>
            <Pressable
              onPress={copyTrustPolicy}
              className="bg-code-bg rounded-lg p-3 active:bg-surface-alt"
            >
              <View className="absolute top-2 right-2 z-10">
                <Copy size={14} color="#888" />
              </View>
              <Text
                className="text-xs text-text-primary font-mono pr-5"
                selectable
              >
                {trustPolicy}
              </Text>
            </Pressable>
            <Text className="text-xs text-text-muted">
              3. Attach a permissions policy for what the agent should access
            </Text>
            <Text className="text-xs text-text-muted">
              4. Copy the role ARN and paste it below
            </Text>
          </Card>

          <View className="gap-2">
            <Text className="text-sm font-medium text-text-primary">
              Role ARN
            </Text>
            <Input
              placeholder="arn:aws:iam::123456789012:role/MyRole"
              value={roleArn}
              onChangeText={setRoleArn}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-text-primary">
              Region (optional)
            </Text>
            <Pressable
              onPress={() => setRegionPickerVisible(true)}
              className="bg-surface border border-app-border rounded-xl px-4 py-3 active:bg-surface-alt"
            >
              <Text
                className={`text-sm ${region ? "text-text-primary" : "text-text-muted"}`}
              >
                {region
                  ? (AWS_REGIONS.find((r) => r.value === region)?.label ??
                    region)
                  : "Select a region"}
              </Text>
            </Pressable>
            <PickerModal
              visible={regionPickerVisible}
              title="AWS Region"
              options={AWS_REGIONS}
              selected={region}
              onSelect={setRegion}
              onClose={() => setRegionPickerVisible(false)}
              searchable
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-text-primary">
              Display Name (optional)
            </Text>
            <Input
              placeholder="e.g. Production Troubleshooting"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>

          <Button
            onPress={() =>
              handleConnect(
                roleArn.trim(),
                displayName.trim() || undefined,
                region.trim() || undefined,
              )
            }
            disabled={connecting || !roleArn.trim()}
            loading={connecting}
            fullWidth
          >
            Test &amp; Connect
          </Button>
        </View>
      )}

      {error ? (
        <View className="bg-red-900/30 border border-red-800/50 rounded-xl p-3">
          <Text className="text-sm text-red-300">{error}</Text>
        </View>
      ) : null}

      <Toast
        message="Copied"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
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
      ) : provider.connectionType === "aws_iam_role" ? (
        <AwsIamRoleDetailView provider={provider} />
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
