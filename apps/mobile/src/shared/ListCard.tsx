import { Link, router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { AgentAvatar } from "./AgentAvatar";
import { Card } from "./Card";

const isWeb = process.env.EXPO_OS === "web";

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
      borderless
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
    // On web, expo-router's Link renders an inline <a> that collapses the
    // card to content width. Link.Preview is iOS-only anyway, so on web we
    // skip the Link wrapper entirely and just call router.push from a
    // Pressable, which renders as a block-level <div>. On native we keep
    // the full Link.Trigger + Link.Preview pattern for the iOS peek.
    if (isWeb) {
      return <Pressable onPress={() => router.push(href)}>{inner}</Pressable>;
    }
    return (
      <Link href={href}>
        <Link.Trigger>{inner}</Link.Trigger>
        <Link.Preview />
      </Link>
    );
  }

  return <Pressable onPress={onPress}>{inner}</Pressable>;
}
