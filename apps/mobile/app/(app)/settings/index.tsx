import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  FolderOpen,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Plug,
  Server,
  Smartphone,
  Sparkles,
  Sun,
  User,
} from "lucide-react-native";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../../src/lib/AuthContext";
import { useServerConfig } from "../../../src/lib/ServerConfigContext";
import { type ThemeMode, useTheme } from "../../../src/lib/ThemeContext";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { Card } from "../../../src/shared/Card";

type SettingsItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

const sections: Array<{ title: string; items: SettingsItem[] }> = [
  {
    title: "Human",
    items: [{ label: "Profile", icon: User, href: "/settings/profile" }],
  },
  {
    title: "Agents",
    items: [
      { label: "Skills", icon: Sparkles, href: "/settings/skills" },
      { label: "Connections", icon: Plug, href: "/settings/connections" },
      { label: "Files", icon: FolderOpen, href: "/settings/files" },
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
  const { logout } = useAuth();
  const { config: serverConfig } = useServerConfig();

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
          <Card className="overflow-hidden">
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
          </Card>
        </View>
      ))}

      <View>
        <Text className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
          Server
        </Text>
        <Card className="overflow-hidden">
          <Pressable
            onPress={() => router.push("/settings/server-settings")}
            className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-alt"
          >
            <View className="w-8 h-8 rounded-lg bg-accent-surface items-center justify-center">
              <Globe size={18} color={colors.accent} />
            </View>
            <Text className="text-base font-medium text-text-primary flex-1">
              Settings
            </Text>
            <Text className="text-text-faint text-lg">{"\u203A"}</Text>
          </Pressable>
          {Platform.OS === "web" && (
            <Pressable
              onPress={() => router.push("/settings/connect-mobile")}
              className="flex-row items-center gap-3 px-4 py-3.5 border-t border-border-subtle active:bg-surface-alt"
            >
              <View className="w-8 h-8 rounded-lg bg-accent-surface items-center justify-center">
                <Smartphone size={18} color={colors.accent} />
              </View>
              <Text className="text-base font-medium text-text-primary flex-1">
                Connect Mobile App
              </Text>
              <Text className="text-text-faint text-lg">{"\u203A"}</Text>
            </Pressable>
          )}
          {Platform.OS !== "web" && serverConfig && (
            <Pressable
              onPress={() => router.push("/settings/server")}
              className="flex-row items-center gap-3 px-4 py-3.5 border-t border-border-subtle active:bg-surface-alt"
            >
              <View className="w-8 h-8 rounded-lg bg-accent-surface items-center justify-center">
                <Server size={18} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-text-primary">
                  Connected Server
                </Text>
                <Text className="text-xs text-text-muted" numberOfLines={1}>
                  {serverConfig.serverUrl}
                </Text>
              </View>
              <Text className="text-text-faint text-lg">{"\u203A"}</Text>
            </Pressable>
          )}
        </Card>
      </View>

      <Pressable
        onPress={logout}
        className="flex-row items-center justify-center gap-2 py-3.5 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 active:opacity-70"
      >
        <LogOut size={18} color="#ef4444" />
        <Text className="text-base font-medium text-red-600 dark:text-red-400">
          Log Out
        </Text>
      </Pressable>
    </ScrollView>
  );
}
