import { router } from "expo-router";
import { CircleCheck } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  SkillsQuery,
  SkillTemplatesQuery,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { groupByCategory } from "../../../../src/shared/categories";
import { QueryResult } from "../../../../src/shared/QueryResult";

export default function SkillsScreen() {
  const [query, setQuery] = useState("");
  const {
    data: skillsData,
    loading: skillsLoading,
    error: skillsError,
  } = useQuery(SkillsQuery);
  const {
    data: templatesData,
    loading: templatesLoading,
    error: templatesError,
  } = useQuery(SkillTemplatesQuery);

  const loading = skillsLoading || templatesLoading;
  const error = skillsError || templatesError;
  const installedSkills = skillsData?.skills ?? [];
  const templates = templatesData?.skillTemplates ?? [];

  const q = query.toLowerCase();
  const filteredInstalled = installedSkills.filter((s) =>
    s.template.name.toLowerCase().includes(q),
  );
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(q),
  );
  const grouped = groupByCategory(filteredTemplates);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-4 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        placeholder="Search skills..."
        value={query}
        onChangeText={setQuery}
        className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-100"
        placeholderTextColor="#737373"
      />

      <QueryResult loading={loading} error={error} />

      {filteredInstalled.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Installed Skills
          </Text>
          {filteredInstalled.map((skill) => (
            <Pressable
              key={skill.id}
              onPress={() => router.push(`/settings/skills/${skill.id}`)}
              className="flex-row items-center gap-3 bg-neutral-900 rounded-xl p-4 active:bg-neutral-800"
            >
              <View className="flex-1 min-w-0">
                <Text
                  className="text-sm font-medium text-neutral-100"
                  numberOfLines={1}
                >
                  {skill.template.name}
                </Text>
                <Text className="text-xs text-neutral-400" numberOfLines={1}>
                  {skill.template.description}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 shrink-0">
                <CircleCheck size={12} color="#34d399" />
                <Text className="text-xs text-emerald-400">Installed</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {filteredInstalled.length > 0 && (
        <View className="border-b border-neutral-800" />
      )}

      {grouped.map((group) => (
        <View key={group.category} className="gap-2">
          <Text className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            {group.label}
          </Text>
          {group.items.map((template) => (
            <Pressable
              key={template.id}
              onPress={() =>
                router.push(`/settings/skills/catalog/${template.id}`)
              }
              className={`bg-neutral-900 rounded-xl p-4 active:bg-neutral-800 ${
                template.installCount > 0 ? "border border-emerald-500/40" : ""
              }`}
            >
              <Text className="text-sm font-medium text-neutral-100">
                {template.name}
              </Text>
              <Text
                className="text-xs text-neutral-400 mt-0.5"
                numberOfLines={2}
              >
                {template.description}
              </Text>
              <View className="mt-2">
                {template.installCount > 0 ? (
                  <View className="flex-row items-center gap-1">
                    <CircleCheck size={12} color="#34d399" />
                    <Text className="text-xs text-emerald-400">
                      {template.installCount} installed
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs text-neutral-500">Connect</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
