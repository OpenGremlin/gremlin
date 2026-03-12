import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SkillTemplatesQuery } from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { groupByCategory } from "../../../../src/shared/categories";
import { QueryResult } from "../../../../src/shared/QueryResult";

export default function SkillsScreen() {
  const colors = useNavigationTheme();
  const [query, setQuery] = useState("");
  const { data, loading, error } = useQuery(SkillTemplatesQuery);

  const templates = data?.skillTemplates ?? [];

  const q = query.toLowerCase();
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q),
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
        className="bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm text-text-primary"
        placeholderTextColor={colors.placeholderText}
      />

      <QueryResult loading={loading} error={error} />

      {grouped.map((group) => (
        <View key={group.category} className="gap-2">
          <Text className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {group.label}
          </Text>
          {group.items.map((template) => (
            <Pressable
              key={template.id}
              onPress={() =>
                router.push(`/settings/skills/catalog/${template.id}`)
              }
              className="bg-surface border border-app-border rounded-xl p-4 active:bg-surface-alt"
            >
              <Text className="text-sm font-medium text-text-primary">
                {template.name}
              </Text>
              <Text
                className="text-xs text-text-muted mt-0.5"
                numberOfLines={2}
              >
                {template.description}
              </Text>
              {template.tags && template.tags.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mt-2">
                  {template.tags.map((tag) => (
                    <Text
                      key={tag}
                      className="text-[10px] text-text-muted bg-surface-alt px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </Text>
                  ))}
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
