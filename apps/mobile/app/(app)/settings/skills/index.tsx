import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SkillTemplatesQuery } from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { groupSkillsByCategory } from "../../../../src/shared/categories";
import { IntegrationLogo } from "../../../../src/shared/IntegrationLogo";
import { QueryResult } from "../../../../src/shared/QueryResult";
import { SearchInput } from "../../../../src/shared/SearchInput";

export default function SkillsScreen() {
  const [query, setQuery] = useState("");
  const colors = useNavigationTheme();
  const { data, loading, error } = useQuery(SkillTemplatesQuery);

  const templates = data?.skillTemplates ?? [];

  const q = query.toLowerCase();
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q),
  );
  const grouped = groupSkillsByCategory(filteredTemplates);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-4 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      <SearchInput
        placeholder="Search skills..."
        value={query}
        onChangeText={setQuery}
      />

      <QueryResult loading={loading} error={error} />

      {grouped.map((group) => (
        <View
          key={group.category}
          className="gap-0 bg-surface border border-app-border rounded-xl overflow-hidden"
        >
          <Text className="text-xs font-medium text-text-muted uppercase tracking-wider px-3 pt-3 pb-1.5">
            {group.label}
          </Text>
          {group.items.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => router.push(`/settings/skills/${template.id}`)}
              className="flex-row items-center gap-3 px-3 py-2.5 active:bg-surface-alt"
            >
              <IntegrationLogo id={template.icon ?? template.id} size={28} />
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-medium text-text-primary">
                  {template.displayName ?? template.name}
                </Text>
                <Text className="text-xs text-text-muted" numberOfLines={1}>
                  {template.description}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.iconDefault} />
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
