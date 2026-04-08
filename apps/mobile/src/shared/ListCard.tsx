import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { AgentAvatar } from "./AgentAvatar";
import { Card } from "./Card";

interface ListCardBaseProps {
  agentId: string;
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  trailing?: ReactNode;
  dimmed?: boolean;
}

// Exactly one of `href` or `onPress` must be provided. Prefer `href`
// so iOS gets a native Link preview on long-press.
type ListCardProps = ListCardBaseProps &
  ({ href: string; onPress?: never } | { href?: never; onPress: () => void });

export function ListCard({
  agentId,
  title,
  href,
  onPress,
  subtitle,
  badge,
  trailing,
  dimmed,
}: ListCardProps) {
  const inner = (
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
  );

  if (href) {
    return (
      <Link href={href}>
        <Link.Trigger>{inner}</Link.Trigger>
        <Link.Preview />
      </Link>
    );
  }

  return <Pressable onPress={onPress}>{inner}</Pressable>;
}
