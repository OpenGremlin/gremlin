import { useQuery } from "@apollo/client";
import { router } from "expo-router";
import {
  Bot,
  ChevronLeft,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Volume2,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo } from "react";
import { Pressable, Text } from "react-native";
import Animated, { withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AgentsQuery, AttachFileReferenceMutation } from "../graphql/queries";
import { useDocumentReader } from "../hooks/useDocumentReader";
import { execute } from "../lib/apolloClient";
import { useLocalSettings } from "../lib/LocalSettingsContext";
import { clientLogger } from "../lib/logger";
import { useTheme } from "../lib/ThemeContext";
import { useVoice } from "../lib/VoiceContext";
import { AgentAvatar } from "./AgentAvatar";
import { presentPicker } from "./PickerModal";

const AVATAR_SIZE = 36;
const COLLAPSE_ANIM_MS = 220;
const COLLAPSE_SLIDE_DISTANCE = 28;

const slideInLeftFade = () => {
  "worklet";
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateX: -COLLAPSE_SLIDE_DISTANCE }],
    },
    animations: {
      opacity: withTiming(1, { duration: COLLAPSE_ANIM_MS }),
      transform: [
        { translateX: withTiming(0, { duration: COLLAPSE_ANIM_MS }) },
      ],
    },
  };
};

const slideOutLeftFade = () => {
  "worklet";
  return {
    initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: COLLAPSE_ANIM_MS }),
      transform: [
        {
          translateX: withTiming(-COLLAPSE_SLIDE_DISTANCE, {
            duration: COLLAPSE_ANIM_MS,
          }),
        },
      ],
    },
  };
};

interface FileActionsProps {
  filePath: string;
  /** Text to read aloud when the Read button is tapped. Omit to hide Read. */
  markdown?: string;
  /** Absolutely position at bottom-left of the parent. */
  absolute?: boolean;
}

/**
 * Shortcut row for engaging an agent with the current file.
 * Avatar opens an agent picker; buttons shown depend on the agent's
 * capabilities and the content type.
 */
export function FileActions({
  filePath,
  markdown,
  absolute,
}: FileActionsProps) {
  const { data } = useQuery(AgentsQuery);
  const { isDark } = useTheme();
  const {
    documentAgentId,
    setDocumentAgentId,
    documentActionsCollapsed,
    setDocumentActionsCollapsed,
  } = useLocalSettings();
  const { playing, paused, pause, resume, unsubscribe } = useVoice();
  const insets = useSafeAreaInsets();

  const agents = useMemo(
    () => (data?.agents ?? []).filter((a) => !a.retired),
    [data?.agents],
  );

  const agent = useMemo(() => {
    if (agents.length === 0) return null;
    if (documentAgentId) {
      const match = agents.find((a) => a.id === documentAgentId);
      if (match) return match;
    }
    return agents[0];
  }, [agents, documentAgentId]);

  const reader = agent?.voiceEnabled ? agent : null;
  const { play, loading } = useDocumentReader(reader);

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const pickAgent = useCallback(() => {
    if (agents.length === 0) return;
    presentPicker({
      title: "Choose agent",
      options: agents.map((a) => ({
        value: a.id,
        label: a.name,
        subtitle: a.role ?? undefined,
        icon: <AgentAvatar id={a.id} size={28} />,
      })),
      selected: agent?.id,
      onSelect: setDocumentAgentId,
    });
  }, [agents, agent?.id, setDocumentAgentId]);

  const handleDiscuss = useCallback(() => {
    if (!agent) return;
    // Dismiss the file preview formSheet first, then navigate. Without this
    // the sheet stays stuck behind the new screen.
    router.dismiss();
    setTimeout(() => {
      router.push(`/agents/${agent.id}`);
    }, 0);
    execute(AttachFileReferenceMutation, {
      input: { agentId: agent.id, filePath },
    }).catch((err) => {
      clientLogger.error("Failed to attach file reference", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, [agent, filePath]);

  const handleRead = useCallback(() => {
    if (loading || !markdown) return;
    if (playing) {
      pause();
    } else if (paused) {
      resume();
    } else {
      play(markdown);
    }
  }, [loading, markdown, playing, paused, pause, resume, play]);

  if (!agent) return null;

  const showRead = !!agent.voiceEnabled && !!markdown;

  const readAccent = isDark ? "#818cf8" : "#6366f1";
  const readBg = isDark ? "#1e1b4b" : "#eef2ff";
  const readText = isDark ? "#c7d2fe" : "#4338ca";

  const discussAccent = isDark ? "#34d399" : "#059669";
  const discussBg = isDark ? "#022c22" : "#ecfdf5";
  const discussText = isDark ? "#a7f3d0" : "#065f46";

  const readIcon = loading ? (
    <Loader2 size={16} color={readAccent} />
  ) : playing ? (
    <Pause size={16} color={readAccent} />
  ) : paused ? (
    <Play size={16} color={readAccent} />
  ) : (
    <Volume2 size={16} color={readAccent} />
  );

  const readLabel = loading
    ? "Loading..."
    : playing
      ? "Playing..."
      : paused
        ? "Paused"
        : "Read";

  const toggleBg = isDark ? "#1f2937" : "#f3f4f6";
  const toggleIconColor = isDark ? "#9ca3af" : "#6b7280";

  const containerStyle = absolute
    ? {
        position: "absolute" as const,
        left: 16,
        bottom: 16 + insets.bottom,
        zIndex: 10,
      }
    : undefined;

  if (documentActionsCollapsed) {
    return (
      <Animated.View
        key="collapsed"
        className="flex-row items-center"
        style={containerStyle}
        entering={slideInLeftFade}
        exiting={slideOutLeftFade}
      >
        <Pressable
          onPress={() => setDocumentActionsCollapsed(false)}
          className="items-center justify-center rounded-full"
          style={{
            backgroundColor: toggleBg,
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
          }}
          hitSlop={8}
        >
          <Bot size={18} color={toggleIconColor} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      key="expanded"
      className="flex-row items-center gap-2"
      style={containerStyle}
      entering={slideInLeftFade}
      exiting={slideOutLeftFade}
    >
      <Pressable onPress={pickAgent}>
        <AgentAvatar id={agent.id} size={AVATAR_SIZE} hideManagerBadge />
      </Pressable>

      {showRead && (
        <Pressable
          onPress={handleRead}
          className="flex-row items-center gap-2 px-3 rounded-lg"
          style={{ backgroundColor: readBg, height: AVATAR_SIZE }}
        >
          {readIcon}
          <Text
            className="text-sm font-medium"
            style={{ color: readText }}
            numberOfLines={1}
          >
            {readLabel}
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleDiscuss}
        className="flex-row items-center gap-2 px-3 rounded-lg"
        style={{ backgroundColor: discussBg, height: AVATAR_SIZE }}
      >
        <MessageSquare size={16} color={discussAccent} />
        <Text className="text-sm font-medium" style={{ color: discussText }}>
          Discuss
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setDocumentActionsCollapsed(true)}
        className="items-center justify-center rounded-full"
        style={{
          backgroundColor: toggleBg,
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
        }}
        hitSlop={8}
      >
        <ChevronLeft size={18} color={toggleIconColor} />
      </Pressable>
    </Animated.View>
  );
}
