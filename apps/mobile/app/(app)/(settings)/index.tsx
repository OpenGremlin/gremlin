import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { FolderOpen, Globe, Plug, Sparkles, User } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

const items: Array<{
  label: string;
  icon: LucideIcon;
  href: string;
}> = [
  { label: "Profile", icon: User, href: "/(app)/(settings)/profile" },
  { label: "Skills", icon: Sparkles, href: "/(app)/(settings)/skills" },
  {
    label: "Integrations",
    icon: Plug,
    href: "/(app)/(settings)/integrations",
  },
  { label: "Files", icon: FolderOpen, href: "/(app)/(settings)/files" },
  { label: "Global", icon: Globe, href: "/(app)/(settings)/global" },
];

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.href)}
            className="flex-row items-center gap-3 px-3 py-3.5 rounded-xl active:bg-neutral-800"
          >
            <View className="w-8 h-8 rounded-lg bg-neutral-800 items-center justify-center">
              <Icon size={18} color="#a3a3a3" />
            </View>
            <Text className="text-sm font-medium text-neutral-100">
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
