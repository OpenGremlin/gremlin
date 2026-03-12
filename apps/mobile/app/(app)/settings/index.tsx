import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  FolderOpen,
  Globe,
  Plug,
  Sparkles,
  User,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
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
    title: "Configuration",
    items: [
      { label: "Skills", icon: Sparkles, href: "/settings/skills" },
      { label: "Integrations", icon: Plug, href: "/settings/integrations" },
      { label: "Files", icon: FolderOpen, href: "/settings/files" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Appearance", icon: Globe, href: "/settings/global" },
    ],
  },
];

export default function SettingsScreen() {
  const colors = useNavigationTheme();
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-6">
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
