import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SkillQuery,
  UninstallSkillMutation,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { gql } from "../../../../src/lib/auth";
import { Badge } from "../../../../src/shared/Badge";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useQuery(SkillQuery, { id: id ?? "" });
  const [uninstalling, setUninstalling] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  const skill = data?.skill ?? null;

  if (!skill) {
    return <NotFound label="Skill not found." />;
  }

  async function handleUninstall() {
    setUninstalling(true);
    try {
      await gql(UninstallSkillMutation, { id });
      router.back();
    } finally {
      setUninstalling(false);
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 gap-4">
      <View>
        <Text className="text-xl font-semibold text-neutral-100 mb-2">
          {skill.template.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Badge label={`v${skill.template.version}`} />
          <Badge label="Installed" />
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-xs text-neutral-500">Description</Text>
        <Text className="text-sm text-neutral-300 leading-relaxed">
          {skill.template.description}
        </Text>
      </View>

      <View className="gap-1">
        <Text className="text-xs text-neutral-500">Instance ID</Text>
        <Text className="text-sm text-neutral-400 font-mono">{skill.id}</Text>
      </View>

      {skill.installedAt ? (
        <View className="gap-1">
          <Text className="text-xs text-neutral-500">Installed</Text>
          <Text className="text-sm text-neutral-400">
            {new Date(skill.installedAt).toLocaleDateString()}
          </Text>
        </View>
      ) : null}

      {skill.template.requiredConnections.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs text-neutral-500">Required Connections</Text>
          {skill.template.requiredConnections.map((rc) => (
            <View
              key={rc.providerId}
              className="bg-neutral-900 rounded-xl p-3 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-sm text-neutral-100">
                  {rc.providerName}
                </Text>
                <Text className="text-xs text-neutral-500">{rc.reason}</Text>
              </View>
              {rc.optional && (
                <Text className="text-xs text-neutral-500">Optional</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={handleUninstall}
        disabled={uninstalling}
        className="bg-neutral-800 rounded-lg px-4 py-2.5 items-center disabled:opacity-50"
      >
        {uninstalling ? (
          <ActivityIndicator color="#d4d4d4" size="small" />
        ) : (
          <Text className="text-sm font-medium text-neutral-300">
            Uninstall
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
