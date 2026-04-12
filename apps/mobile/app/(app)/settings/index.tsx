import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Cpu,
  Globe,
  KeyRound,
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
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../../../src/lib/AuthContext";
import { useServerConfig } from "../../../src/lib/ServerConfigContext";
import { type ThemeMode, useTheme } from "../../../src/lib/ThemeContext";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { Card } from "../../../src/shared/Card";
import { TabScrollView } from "../../../src/shared/TabScrollView";

type SettingsItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

const sections: Array<{ title: string; items: SettingsItem[] }> = [
  {
    title: "Human",
    items: [
      { label: "Profile", icon: User, href: "/settings/profile" },
      {
        label: "Change Password",
        icon: KeyRound,
        href: "/settings/change-password",
      },
    ],
  },
  {
    title: "Agents",
    items: [
      { label: "Models", icon: Cpu, href: "/settings/models" },
      { label: "Connections", icon: Plug, href: "/settings/connections" },
      { label: "Skills", icon: Sparkles, href: "/settings/skills" },
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
    <TabScrollView contentContainerClassName="px-4 pt-4 gap-6">
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
          Settings
        </Text>
        <Card className="overflow-hidden">
          <Pressable
            onPress={() => router.push("/settings/general")}
            className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-alt"
          >
            <View className="w-8 h-8 rounded-lg bg-accent-surface items-center justify-center">
              <Globe size={18} color={colors.accent} />
            </View>
            <Text className="text-base font-medium text-text-primary flex-1">
              General
            </Text>
            <Text className="text-text-faint text-lg">{"\u203A"}</Text>
          </Pressable>
          {process.env.EXPO_OS === "web" && (
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
          {process.env.EXPO_OS !== "web" && serverConfig && (
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
        className="flex-row items-center justify-center gap-2 py-3.5 rounded-lg border border-error-border bg-error-surface active:opacity-70"
      >
        <LogOut size={18} color={colors.error} />
        <Text className="text-base font-medium text-error">Log Out</Text>
      </Pressable>
    </TabScrollView>
  );
}
