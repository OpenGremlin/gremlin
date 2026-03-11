import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  BindSkillConnectionMutation,
  SkillQuery,
  UninstallSkillMutation,
} from "../../../../src/graphql/queries";
import { IntegrationConnectionsQuery } from "../../../../src/graphql/queries/integrations";
import { useQuery } from "../../../../src/hooks/useQuery";
import { gql } from "../../../../src/lib/auth";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { Badge } from "../../../../src/shared/Badge";
import { ConnectionPicker } from "../../../../src/shared/ConnectionPicker";
import { DestructiveButton } from "../../../../src/shared/DestructiveButton";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

export default function SkillDetailScreen() {
  const colors = useNavigationTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useQuery(SkillQuery, {
    id: id ?? "",
  });
  const {
    data: connectionsData,
    loading: connectionsLoading,
    error: connectionsError,
  } = useQuery(IntegrationConnectionsQuery);
  const [uninstalling, setUninstalling] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<
    Record<string, string>
  >({});

  const skill = data?.skill ?? null;
  const connections = connectionsData?.integrationConnections ?? [];

  useEffect(() => {
    if (!skill) return;
    const bound: Record<string, string> = {};
    for (const rc of skill.requiredConnections) {
      if (rc.boundConnectionId) {
        bound[rc.providerId] = rc.boundConnectionId;
      }
    }
    if (Object.keys(bound).length > 0) {
      setSelectedConnections((prev) => ({ ...bound, ...prev }));
    }
  }, [skill]);

  if (loading || error || connectionsLoading || connectionsError) {
    return (
      <QueryResult
        loading={loading || connectionsLoading}
        error={error || connectionsError}
      />
    );
  }

  if (!skill) {
    return <NotFound label="Skill not found." />;
  }

  const templateReqs = skill.template.requiredConnections;

  async function handleBindConnection(
    providerId: string,
    connectionId: string,
  ) {
    await gql(BindSkillConnectionMutation, {
      id: id ?? "",
      providerId,
      connectionId,
    });
    setSelectedConnections((prev) => ({ ...prev, [providerId]: connectionId }));
  }

  async function handleUninstall() {
    setUninstalling(true);
    try {
      await gql(UninstallSkillMutation, { id: id ?? "" });
      router.back();
    } finally {
      setUninstalling(false);
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 gap-4">
      <View>
        <Text className="text-xl font-semibold text-text-primary mb-2">
          {skill.template.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Badge label={`v${skill.template.version}`} />
          <Badge label="Installed" />
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-xs text-text-muted">Description</Text>
        <Text className="text-sm text-text-secondary leading-relaxed">
          {skill.template.description}
        </Text>
      </View>

      <View className="gap-1">
        <Text className="text-xs text-text-muted">Instance ID</Text>
        <Text className="text-sm text-text-muted font-mono">{skill.id}</Text>
      </View>

      {skill.installedAt ? (
        <View className="gap-1">
          <Text className="text-xs text-text-muted">Installed</Text>
          <Text className="text-sm text-text-muted">
            {new Date(skill.installedAt).toLocaleDateString()}
          </Text>
        </View>
      ) : null}

      {templateReqs.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs text-text-muted">Connections</Text>
          <ConnectionPicker
            requirements={templateReqs}
            connections={connections}
            selected={selectedConnections}
            onSelect={handleBindConnection}
          />
        </View>
      )}

      <DestructiveButton
        onPress={handleUninstall}
        loading={uninstalling}
        label="Uninstall"
      />
    </ScrollView>
  );
}
