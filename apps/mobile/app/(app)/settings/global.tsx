import type { LucideIcon } from "lucide-react-native";
import { Monitor, Moon, Sun } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  GlobalSettingsQuery,
  UpdateGlobalSettingsMutation,
} from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { gql } from "../../../src/lib/auth";
import { type ThemeMode, useTheme } from "../../../src/lib/ThemeContext";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { QueryResult } from "../../../src/shared/QueryResult";
import { SavedIndicator } from "../../../src/shared/SavedIndicator";
import { Toggle } from "../../../src/shared/Toggle";

const themeOptions: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function GlobalSettingsScreen() {
  const colors = useNavigationTheme();
  const { mode, isDark, setMode } = useTheme();
  const { data, loading, error, refetch } = useQuery(GlobalSettingsQuery);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  const settings = data?.globalSettings;

  async function toggleSignupDisabled() {
    setSaving(true);
    try {
      await gql(UpdateGlobalSettingsMutation, {
        signupDisabled: !settings?.signupDisabled,
      });
      refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 gap-6">
      <View>
        <Text className="text-lg font-semibold text-text-primary">
          Settings
        </Text>
        <Text className="mt-1 text-sm text-text-muted">
          Global settings for your Gremlin instance.
        </Text>
      </View>

      <View className="rounded-xl border border-app-border bg-surface p-4 gap-3">
        <View>
          <Text className="text-sm font-medium text-text-primary">
            Appearance
          </Text>
          <Text className="mt-0.5 text-xs text-text-muted">
            Choose light or dark mode, or follow your system setting.
          </Text>
        </View>
        <View className="flex-row gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const selected = mode === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setMode(option.value)}
                className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg border ${
                  selected
                    ? "bg-indigo-600/20 border-indigo-500/40"
                    : "bg-surface-alt border-app-border"
                }`}
              >
                <Icon
                  size={14}
                  color={selected ? colors.accentIndicator : colors.iconMuted}
                />
                <Text
                  className={`text-sm font-medium ${
                    selected ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-row items-center justify-between rounded-xl border border-app-border bg-surface p-4">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-medium text-text-primary">
            Disable signup
          </Text>
          <Text className="mt-0.5 text-xs text-text-muted">
            Prevent new users from creating accounts. Existing users are not
            affected.
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          {saved && <SavedIndicator />}
          <Toggle
            enabled={!!settings?.signupDisabled}
            disabled={saving}
            onChange={toggleSignupDisabled}
          />
        </View>
      </View>
    </ScrollView>
  );
}
