import { ChevronRight } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { Markdown } from "./Markdown";

function formatElapsed(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 1) return "for less than a second";
  if (seconds === 1) return "for 1 second";
  return `for ${seconds} seconds`;
}

/**
 * Collapsible reasoning/thinking block shown above agent text.
 *
 * During streaming: starts expanded, auto-collapses when text output begins.
 * After streaming: collapsed by default, tappable to expand.
 */
export function ReasoningBlock({
  reasoning,
  isStreaming = false,
  elapsedMs,
}: {
  reasoning: string;
  /** Whether reasoning is still being streamed. */
  isStreaming?: boolean;
  /** How long reasoning took (shown in the header after completion). */
  elapsedMs?: number | null;
}) {
  const colors = useNavigationTheme();
  const [expanded, setExpanded] = useState(isStreaming);
  const rotation = useRef(new Animated.Value(isStreaming ? 1 : 0)).current;

  // Auto-collapse when streaming reasoning finishes (text starts)
  const wasStreaming = useRef(isStreaming);
  useEffect(() => {
    if (wasStreaming.current && !isStreaming) {
      setExpanded(false);
      Animated.timing(rotation, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
    wasStreaming.current = isStreaming;
  }, [isStreaming, rotation]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(rotation, {
      toValue: next ? 1 : 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const label = isStreaming
    ? "Thinking\u2026"
    : elapsedMs != null && elapsedMs > 0
      ? `Thought ${formatElapsed(elapsedMs)}`
      : "Thought";

  return (
    <View className="mb-1">
      <Pressable
        onPress={toggle}
        className="flex-row items-center gap-1 py-1"
        hitSlop={8}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronRight size={12} color={colors.iconMuted} />
        </Animated.View>
        <Text className="text-xs text-text-muted italic">{label}</Text>
      </Pressable>
      {expanded && (
        <View className="pl-4 opacity-70">
          <Markdown variant="agent">{reasoning}</Markdown>
        </View>
      )}
    </View>
  );
}
