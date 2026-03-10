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
  InstallSkillMutation,
  SkillTemplateQuery,
} from "../../../../../src/graphql/queries";
import { useQuery } from "../../../../../src/hooks/useQuery";
import { gql } from "../../../../../src/lib/auth";
import { Badge } from "../../../../../src/shared/Badge";
import { NotFound, QueryResult } from "../../../../../src/shared/QueryResult";

export default function SkillTemplateScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const { data, loading, error } = useQuery(SkillTemplateQuery, {
    id: templateId ?? "",
  });
  const [installing, setInstalling] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  const template = data?.skillTemplate ?? null;

  if (!template) {
    return <NotFound label="Skill template not found." />;
  }

  async function handleInstall() {
    setInstalling(true);
    try {
      const result = await gql<{ installSkill: { id: string } }>(
        InstallSkillMutation,
        { templateId },
      );
      router.replace(`/(app)/(settings)/skills/${result.installSkill.id}`);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 gap-4">
      <View>
        <Text className="text-xl font-semibold text-neutral-100 mb-2">
          {template.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Badge label={`v${template.version}`} />
          <Badge label={template.category} />
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-xs text-neutral-500">Description</Text>
        <Text className="text-sm text-neutral-300 leading-relaxed">
          {template.description}
        </Text>
      </View>

      {template.author ? (
        <View className="gap-1">
          <Text className="text-xs text-neutral-500">Author</Text>
          <Text className="text-sm text-neutral-400">{template.author}</Text>
        </View>
      ) : null}

      {template.requiredConnections.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs text-neutral-500">Required Connections</Text>
          {template.requiredConnections.map((rc) => (
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
        onPress={handleInstall}
        disabled={installing}
        className="bg-indigo-600 rounded-lg px-4 py-2.5 items-center disabled:opacity-50"
      >
        {installing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-sm font-medium text-white">Install</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
