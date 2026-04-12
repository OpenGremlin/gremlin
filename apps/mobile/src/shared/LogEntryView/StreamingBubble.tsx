import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import ReanimatedModule, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { StreamingMessage } from "../../hooks/useAgentStream";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { Markdown } from "./Markdown";
import { ReasoningBlock } from "./ReasoningBlock";

const dotStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#888",
};

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const useNativeDriver = process.env.EXPO_OS !== "web";
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver,
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
    <View className="flex-row items-center gap-1 pt-1 pb-2 px-1">
      <Animated.View style={[dotStyle, { opacity: dot1 }]} />
      <Animated.View style={[dotStyle, { opacity: dot2 }]} />
      <Animated.View style={[dotStyle, { opacity: dot3 }]} />
    </View>
  );
}

function StreamingCursor() {
  const colors = useNavigationTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ReanimatedModule.View
      style={[
        {
          width: 2,
          height: 14,
          borderRadius: 1,
          backgroundColor: colors.accent,
          marginBottom: 2,
        },
        animStyle,
      ]}
    />
  );
}

export function StreamingBubble({ message }: { message: StreamingMessage }) {
  const hasContent = message.content.length > 0;
  const hasReasoning = message.reasoning.length > 0;
  const isReasoningStreaming = hasReasoning && !hasContent;

  const elapsedMs =
    message.reasoningEndedAt && message.reasoningStartedAt
      ? message.reasoningEndedAt - message.reasoningStartedAt
      : null;

  return (
    <View className="py-2">
      <View className="flex-row justify-start">
        <View className="max-w-[85%] bg-surface rounded-2xl rounded-bl-md px-3.5 pt-2 pb-0.5">
          {hasReasoning && (
            <ReasoningBlock
              reasoning={message.reasoning}
              isStreaming={isReasoningStreaming}
              elapsedMs={elapsedMs}
            />
          )}
          {hasContent ? (
            <>
              <Markdown variant="agent">{message.content}</Markdown>
              <StreamingCursor />
            </>
          ) : (
            !hasReasoning && <TypingDots />
          )}
        </View>
      </View>
    </View>
  );
}
