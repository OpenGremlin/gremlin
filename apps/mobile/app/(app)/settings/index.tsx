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

const items: Array<{
  label: string;
  icon: LucideIcon;
  href: string;
}> = [
  { label: "Notifications", icon: Bell, href: "/settings/notifications" },
  { label: "Profile", icon: User, href: "/settings/profile" },
  { label: "Skills", icon: Sparkles, href: "/settings/skills" },
  {
    label: "Integrations",
    icon: Plug,
    href: "/settings/integrations",
  },
  { label: "Files", icon: FolderOpen, href: "/settings/files" },
  { label: "Global", icon: Globe, href: "/settings/global" },
];

export default function SettingsScreen() {
  const colors = useNavigationTheme();
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.href)}
            className="flex-row items-center gap-3 px-3 py-3.5 rounded-xl active:bg-surface-alt"
          >
            <View className="w-8 h-8 rounded-lg bg-surface border border-app-border items-center justify-center">
              <Icon size={18} color={colors.iconDefault} />
            </View>
            <Text className="text-sm font-medium text-text-primary">
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
