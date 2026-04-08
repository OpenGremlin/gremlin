import { useQuery } from "@apollo/client";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  AssignSkillMutation,
  SkillTemplatesQuery,
} from "../../src/graphql/queries";
import { execute } from "../../src/lib/apolloClient";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";
import { groupSkillsByCategory } from "../../src/shared/categories";
import { IntegrationLogo } from "../../src/shared/IntegrationLogo";
import { SearchInput } from "../../src/shared/SearchInput";
import { Sheet } from "../../src/shared/Sheet";

export interface AddSkillSheetPayload {
  agentId: string;
  assignedSkillIds: string[];
  /** Called after a skill is successfully assigned. The route then pops. */
  onAssigned: () => void;
}

export default function AddSkillSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<AddSkillSheetPayload>(id);
  const colors = useNavigationTheme();
  const { data, loading } = useQuery(SkillTemplatesQuery);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  if (!payload) return null;

  const templates = data?.skillTemplates ?? [];
  const available = templates.filter(
    (t) => !payload.assignedSkillIds.includes(t.id),
  );
  const q = query.toLowerCase();
  const filtered = available.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q),
  );
  const grouped = groupSkillsByCategory(filtered);

  async function handleAssign(skillId: string) {
    if (!payload) return;
    setAssigning(skillId);
    try {
      await execute(AssignSkillMutation, {
        agentId: payload.agentId,
        skillId,
      });
      payload.onAssigned();
      router.back();
    } finally {
      setAssigning(null);
    }
  }

  return (
    <Sheet title="Add Skill">
      <ScrollView
        contentContainerClassName="px-4 py-3 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <SearchInput
          placeholder="Search skills..."
          value={query}
          onChangeText={setQuery}
        />

        {loading && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color={colors.iconDefault} />
          </View>
        )}

        {filtered.length === 0 && !loading && (
          <Text className="text-sm text-text-muted py-4 text-center">
            {available.length === 0
              ? "All available skills are already assigned."
              : "No skills match your search."}
          </Text>
        )}

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
                onPress={() => handleAssign(template.id)}
                disabled={assigning !== null}
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
                {assigning === template.id ? (
                  <ActivityIndicator size="small" color={colors.iconDefault} />
                ) : (
                  <ChevronRight size={16} color={colors.iconDefault} />
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}
