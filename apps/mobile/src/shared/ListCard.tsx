import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { AgentAvatar } from "./AgentAvatar";
import { Card } from "./Card";

interface ListCardProps {
  agentId: string;
  title: string;
  onPress: () => void;
  subtitle?: ReactNode;
  badge?: ReactNode;
  trailing?: ReactNode;
  dimmed?: boolean;
}

export function ListCard({
  agentId,
  title,
  onPress,
  subtitle,
  badge,
  trailing,
  dimmed,
}: ListCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card
        className={`p-4 flex-row items-start gap-3 ${dimmed ? "opacity-50" : ""}`}
      >
        <AgentAvatar id={agentId} />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-sm font-medium text-text-primary flex-1"
              numberOfLines={1}
            >
              {title}
            </Text>
            {badge}
          </View>
          {subtitle}
        </View>
        {trailing}
      </Card>
    </Pressable>
  );
}
