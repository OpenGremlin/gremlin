import { useQuery } from "@apollo/client";
import { ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { AssignSkillMutation, SkillTemplatesQuery } from "../graphql/queries";
import { execute } from "../lib/apolloClient";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { BottomSheet } from "./BottomSheet";
import { groupSkillsByCategory } from "./categories";
import { IntegrationLogo } from "./IntegrationLogo";
import { SearchInput } from "./SearchInput";

export interface AddSkillPickerProps {
  visible: boolean;
  agentId: string;
  assignedSkillIds: string[];
  onAssigned: () => void;
  onDismiss: () => void;
}

export function AddSkillPicker({
  visible,
  agentId,
  assignedSkillIds,
  onAssigned,
  onDismiss,
}: AddSkillPickerProps) {
  const colors = useNavigationTheme();
  const { data, loading } = useQuery(SkillTemplatesQuery);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const templates = data?.skillTemplates ?? [];
  const q = query.toLowerCase();
  const available = useMemo(
    () => templates.filter((t) => !assignedSkillIds.includes(t.id)),
    [templates, assignedSkillIds],
  );
  const filtered = useMemo(
    () =>
      available.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      ),
    [available, q],
  );
  const grouped = useMemo(() => groupSkillsByCategory(filtered), [filtered]);

  async function handleAssign(skillId: string) {
    setAssigning(skillId);
    try {
      await execute(AssignSkillMutation, { agentId, skillId });
      onAssigned();
      onDismiss();
    } finally {
      setAssigning(null);
    }
  }

  return (
    <BottomSheet visible={visible} title="Add Skill" onDismiss={onDismiss}>
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
            <Text className="text-sm font-medium text-text-muted uppercase tracking-wider px-3 pt-3 pb-1.5">
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
    </BottomSheet>
  );
}
