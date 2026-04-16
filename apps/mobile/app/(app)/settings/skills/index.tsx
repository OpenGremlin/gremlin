import { useQuery } from "@apollo/client";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { SkillTemplatesQuery } from "../../../../src/graphql/queries";
import { useListRefresh } from "../../../../src/hooks/useListRefresh";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { groupSkillsByCategory } from "../../../../src/shared/categories";
import { IntegrationLogo } from "../../../../src/shared/IntegrationLogo";
import { QueryGate } from "../../../../src/shared/QueryResult";
import { SearchInput } from "../../../../src/shared/SearchInput";
import { TabScrollView } from "../../../../src/shared/TabScrollView";

export default function SkillsScreen() {
  const [query, setQuery] = useState("");
  const colors = useNavigationTheme();
  const { data, loading, error, refetch } = useQuery(SkillTemplatesQuery);
  const { refreshing, onRefresh } = useListRefresh(refetch);

  const templates = data?.skillTemplates ?? [];

  const q = query.toLowerCase();
  const grouped = useMemo(() => {
    const filtered = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.displayName?.toLowerCase().includes(q) ?? false) ||
        t.description.toLowerCase().includes(q) ||
        (t.tags?.some((tag) => tag.toLowerCase().includes(q)) ?? false),
    );
    return groupSkillsByCategory(filtered);
  }, [templates, q]);

  return (
    <QueryGate loading={loading} error={error} data={data}>
      <TabScrollView
        contentContainerClassName="px-4 pt-4 gap-5"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.loadingIndicator}
          />
        }
      >
        <SearchInput
          placeholder="Search skills..."
          value={query}
          onChangeText={setQuery}
        />

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
      </TabScrollView>
    </QueryGate>
  );
}
