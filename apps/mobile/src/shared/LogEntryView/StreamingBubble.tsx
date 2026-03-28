import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import type { StreamingMessage } from "../../hooks/useAgentStream";
import { Markdown } from "./Markdown";

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-center gap-1 py-1 px-1">
      <Animated.View
        style={{ opacity: dot1 }}
        className="w-2 h-2 rounded-full bg-text-muted"
      />
      <Animated.View
        style={{ opacity: dot2 }}
        className="w-2 h-2 rounded-full bg-text-muted"
      />
      <Animated.View
        style={{ opacity: dot3 }}
        className="w-2 h-2 rounded-full bg-text-muted"
      />
    </View>
  );
}

export function StreamingBubble({ message }: { message: StreamingMessage }) {
  const hasContent = message.content.length > 0;

  return (
    <View className="py-2">
      <View className="flex-row justify-start">
        <View className="max-w-[85%] bg-surface rounded-2xl rounded-bl-md px-3.5 pt-2 pb-0.5">
          {hasContent ? (
            <Markdown variant="agent">{message.content}</Markdown>
          ) : (
            <TypingDots />
          )}
        </View>
      </View>
    </View>
  );
}
