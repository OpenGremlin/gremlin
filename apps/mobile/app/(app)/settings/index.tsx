import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  FolderOpen,
  Globe,
  Monitor,
  Moon,
  Plug,
  Sparkles,
  Sun,
  User,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { type ThemeMode, useTheme } from "../../../src/lib/ThemeContext";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";

type SettingsItem = { label: string; icon: LucideIcon; href: string };

const sections: Array<{ title: string; items: SettingsItem[] }> = [
  {
    title: "Account",
    items: [
      { label: "Profile", icon: User, href: "/settings/profile" },
      { label: "Notifications", icon: Bell, href: "/settings/notifications" },
    ],
  },
  {
    title: "Agents",
    items: [
      { label: "Skills", icon: Sparkles, href: "/settings/skills" },
      { label: "Integrations", icon: Plug, href: "/settings/integrations" },
      { label: "Files", icon: FolderOpen, href: "/settings/files" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "General", icon: Globe, href: "/settings/global" },
    ],
  },
];

const themeOptions: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function SettingsScreen() {
  const colors = useNavigationTheme();
  const { mode, setMode } = useTheme();
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-6">
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
                  ? "bg-accent-surface border-accent-border"
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

      {sections.map((section) => (
        <View key={section.title}>
          <Text className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
            {section.title}
          </Text>
          <View className="bg-surface border border-app-border rounded-xl overflow-hidden">
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.href)}
                  className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-alt ${
                    i > 0 ? "border-t border-border-subtle" : ""
                  }`}
                >
                  <View className="w-8 h-8 rounded-lg bg-accent-surface items-center justify-center">
                    <Icon size={18} color={colors.accent} />
                  </View>
                  <Text className="text-base font-medium text-text-primary flex-1">
                    {item.label}
                  </Text>
                  <Text className="text-text-faint text-lg">{"\u203A"}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
