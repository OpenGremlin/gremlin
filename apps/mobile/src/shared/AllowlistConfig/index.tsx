import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  AddCommandAllowlistEntryMutation,
  CommandAllowlistQuery,
  RemoveCommandAllowlistEntryMutation,
} from "../../graphql/queries";
import { useQuery } from "../../hooks/useQuery";
import { gql } from "../../lib/auth";
import { useNavigationTheme } from "../../lib/useNavigationTheme";

export function AllowlistConfig({ agentId }: { agentId: string }) {
  const colors = useNavigationTheme();
  const { data, setData } = useQuery(CommandAllowlistQuery, { agentId });
  const [adding, setAdding] = useState(false);
  const [newPattern, setNewPattern] = useState("");
  const [busy, setBusy] = useState(false);

  const entries = data?.commandAllowlist ?? [];

  async function addEntry() {
    const trimmed = newPattern.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const result = await gql(AddCommandAllowlistEntryMutation, {
        agentId,
        pattern: trimmed,
      });
      setData({ commandAllowlist: result.addCommandAllowlistEntry });
      setNewPattern("");
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(pattern: string) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await gql(RemoveCommandAllowlistEntryMutation, {
        agentId,
        pattern,
      });
      setData({ commandAllowlist: result.removeCommandAllowlistEntry });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm text-text-secondary">Allowed commands</Text>
        <Pressable
          onPress={() => setAdding(true)}
          className="flex-row items-center gap-1 px-2 py-1"
        >
          <Plus size={14} color={colors.iconDefault} />
          <Text className="text-xs text-text-muted">Add</Text>
        </Pressable>
      </View>

      {entries.length === 0 && !adding && (
        <Text className="text-xs text-text-faint">
          No custom commands allowed. Unapproved commands will require approval.
        </Text>
      )}

      {entries.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5">
          {entries.map((entry) => (
            <View
              key={entry.pattern}
              className="flex-row items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg border bg-surface-alt border-app-border"
            >
              <Text className="text-xs text-text-secondary font-mono">
                {entry.pattern}
              </Text>
              <Pressable
                onPress={() => removeEntry(entry.pattern)}
                className="p-0.5"
                hitSlop={8}
              >
                <X size={12} color={colors.iconDefault} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {adding && (
        <View className="flex-row items-center gap-2 mt-1.5">
          <TextInput
            value={newPattern}
            onChangeText={setNewPattern}
            onSubmitEditing={addEntry}
            placeholder="e.g. docker, npm, cargo"
            placeholderTextColor={colors.placeholderText}
            autoFocus
            className="flex-1 px-3 py-2 rounded-lg border bg-surface-alt border-app-border text-sm text-text-secondary font-mono"
          />
          <Pressable
            onPress={addEntry}
            disabled={!newPattern.trim() || busy}
            className="px-3 py-2 rounded-lg bg-accent-surface border border-accent-border"
          >
            <Text className="text-xs text-text-primary">Add</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setAdding(false);
              setNewPattern("");
            }}
            className="px-3 py-2"
          >
            <Text className="text-xs text-text-muted">Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
