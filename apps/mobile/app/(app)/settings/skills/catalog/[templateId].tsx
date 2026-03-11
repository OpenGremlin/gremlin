import { router, useLocalSearchParams } from "expo-router";
import { CircleCheck } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  BindSkillConnectionMutation,
  InstallSkillMutation,
  SkillsQuery,
  SkillTemplateQuery,
} from "../../../../../src/graphql/queries";
import { IntegrationConnectionsQuery } from "../../../../../src/graphql/queries/integrations";
import { useQuery } from "../../../../../src/hooks/useQuery";
import { gql } from "../../../../../src/lib/auth";
import { Badge } from "../../../../../src/shared/Badge";
import { ConnectionPicker } from "../../../../../src/shared/ConnectionPicker";
import { NotFound, QueryResult } from "../../../../../src/shared/QueryResult";

export default function SkillTemplateScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const { data, loading, error } = useQuery(SkillTemplateQuery, {
    id: templateId ?? "",
  });
  const {
    data: skillsData,
    loading: skillsLoading,
    error: skillsError,
  } = useQuery(SkillsQuery);
  const {
    data: connectionsData,
    loading: connectionsLoading,
    error: connectionsError,
  } = useQuery(IntegrationConnectionsQuery);

  const [installing, setInstalling] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<
    Record<string, string>
  >({});

  const template = data?.skillTemplate ?? null;
  const connections = connectionsData?.integrationConnections ?? [];
  const instances = (skillsData?.skills ?? []).filter(
    (s) => s.template.id === templateId,
  );

  const anyLoading = loading || skillsLoading || connectionsLoading;
  const anyError = error || skillsError || connectionsError;

  if (anyLoading || anyError) {
    return <QueryResult loading={anyLoading} error={anyError} />;
  }

  if (!template) {
    return <NotFound label="Skill template not found." />;
  }

  const templateReqs = template.requiredConnections;
  const requiredProviderIds = templateReqs
    .filter((r) => !r.optional)
    .map((r) => r.providerId);
  const allRequiredSelected = requiredProviderIds.every(
    (pid) => selectedConnections[pid],
  );
  const installDisabled =
    installing || (templateReqs.length > 0 && !allRequiredSelected);

  function selectConnection(providerId: string, connectionId: string) {
    setSelectedConnections((prev) => ({ ...prev, [providerId]: connectionId }));
  }

  async function handleInstall() {
    setInstalling(true);
    try {
      const result = await gql(InstallSkillMutation, {
        templateId: templateId ?? "",
      });
      const skill = result.installSkill;
      if (!skill) throw new Error("Failed to install skill");

      for (const [providerId, connectionId] of Object.entries(
        selectedConnections,
      )) {
        await gql(BindSkillConnectionMutation, {
          id: skill.id,
          providerId,
          connectionId,
        });
      }

      router.replace(`/settings/skills/${skill.id}` as never);
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

      {instances.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs text-neutral-500">
            Installed Instances ({instances.length})
          </Text>
          {instances.map((inst) => (
            <Pressable
              key={inst.id}
              onPress={() =>
                router.push(`/settings/skills/${inst.id}` as never)
              }
              className="flex-row items-center gap-3 bg-neutral-900 rounded-xl p-3"
            >
              <View className="flex-1">
                <Text className="text-sm text-neutral-100">
                  {inst.template.name}
                </Text>
                <Text className="text-xs text-neutral-500">
                  {inst.id.slice(0, 8)}...
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <CircleCheck size={12} color="#34d399" />
                <Text className="text-xs text-emerald-400">Installed</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {templateReqs.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs text-neutral-500">
            Select connections for new instance
          </Text>
          <ConnectionPicker
            requirements={templateReqs}
            connections={connections}
            selected={selectedConnections}
            onSelect={selectConnection}
          />
        </View>
      )}

      <Pressable
        onPress={handleInstall}
        disabled={installDisabled}
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
