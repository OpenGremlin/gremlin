import { Check, Pause, Play, Volume2 } from "lucide-react-native";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SpeechVoicesQuery } from "../graphql/queries";
import { execute } from "../lib/apolloClient";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { useVoice } from "../lib/VoiceContext";
import { BottomSheet } from "./BottomSheet";
import { decideToggleAction, shouldClearActive } from "./voicePickerState";

type Voice = {
  id: string;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
};

interface PreviewButtonProps {
  url: string;
  isActive: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onToggle: (url: string) => void;
}

const PreviewButton = memo(function PreviewButton({
  url,
  isActive,
  isPlaying,
  isLoading,
  onToggle,
}: PreviewButtonProps) {
  const colors = useNavigationTheme();
  const showSpinner = isActive && isLoading;
  const showPause = isActive && isPlaying && !isLoading;

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation();
        onToggle(url);
      }}
      hitSlop={4}
      style={
        showPause
          ? { backgroundColor: `${colors.accentIndicator}20` }
          : undefined
      }
      className={`w-8 h-8 items-center justify-center rounded-full ${showPause ? "" : "bg-surface"}`}
    >
      {showSpinner ? (
        <ActivityIndicator size="small" color={colors.accentIndicator} />
      ) : showPause ? (
        <Pause
          size={14}
          color={colors.accentIndicator}
          fill={colors.accentIndicator}
        />
      ) : (
        <Play size={14} color={colors.iconDefault} fill={colors.iconDefault} />
      )}
    </Pressable>
  );
});

export interface VoicePickerProps {
  visible: boolean;
  connectionId: string | undefined;
  currentVoice: string | null | undefined;
  onSelect: (voice: string) => void;
  onDismiss: () => void;
}

export function VoicePicker({
  visible,
  connectionId,
  currentVoice,
  onSelect,
  onDismiss,
}: VoicePickerProps) {
  const colors = useNavigationTheme();
  const {
    playUrls,
    pause: pausePlayback,
    resume,
    playing,
    paused,
    loading: audioLoading,
  } = useVoice();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  // URL of the preview the picker last initiated. Cleared by shouldClearActive
  // once the provider reports a fully idle playback state.
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  // Mirror reactive state into refs so togglePreview can be a stable callback.
  // A stable onToggle lets PreviewButton's React.memo actually skip re-renders
  // on every context tick when the list is long.
  const stateRef = useRef({ activeUrl, playing, paused });
  stateRef.current = { activeUrl, playing, paused };

  useEffect(() => {
    if (!connectionId || !visible) {
      setVoicesLoading(false);
      return;
    }
    let cancelled = false;
    setVoicesLoading(true);
    execute(SpeechVoicesQuery, { connectionId }).then((result) => {
      if (cancelled) return;
      setVoices(result.speechVoices);
      setVoicesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [connectionId, visible]);

  useEffect(() => {
    if (
      shouldClearActive({ activeUrl, playing, paused, loading: audioLoading })
    ) {
      setActiveUrl(null);
    }
  }, [activeUrl, playing, paused, audioLoading]);

  useEffect(() => {
    if (!visible && activeUrl) {
      pausePlayback();
      setActiveUrl(null);
    }
  }, [visible, activeUrl, pausePlayback]);

  const togglePreview = useCallback(
    (url: string) => {
      const action = decideToggleAction(url, stateRef.current);
      switch (action.type) {
        case "play":
          playUrls([action.url]);
          setActiveUrl(action.url);
          return;
        case "pause":
          pausePlayback();
          return;
        case "resume":
          resume();
          return;
        case "noop":
          return;
      }
    },
    [playUrls, pausePlayback, resume],
  );

  return (
    <BottomSheet visible={visible} title="Choose Voice" onDismiss={onDismiss}>
      {voicesLoading ? (
        <View className="py-8 items-center">
          <Text className="text-sm text-text-muted">Loading voices...</Text>
        </View>
      ) : (
        <FlatList
          data={voices}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-3"
          renderItem={({ item }) => {
            const selected = currentVoice === item.id;
            const previewUrl = item.previewUrl;
            const isActive = previewUrl != null && activeUrl === previewUrl;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item.id);
                  onDismiss();
                }}
                className={`flex-row items-center gap-3 px-3 py-3 rounded-lg ${
                  selected ? "bg-surface-alt" : "active:bg-surface-alt"
                }`}
              >
                {previewUrl ? (
                  <PreviewButton
                    url={previewUrl}
                    isActive={isActive}
                    isPlaying={isActive && playing}
                    isLoading={isActive && audioLoading}
                    onToggle={togglePreview}
                  />
                ) : (
                  <View className="w-8 h-8 items-center justify-center">
                    <Volume2
                      size={16}
                      color={selected ? colors.headerText : colors.iconDefault}
                    />
                  </View>
                )}
                <View className="flex-1">
                  <Text
                    className={`text-sm ${selected ? "text-text-primary font-medium" : "text-text-secondary"}`}
                  >
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text className="text-xs text-text-muted" numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                </View>
                {selected && <Check size={16} color={colors.headerText} />}
              </Pressable>
            );
          }}
        />
      )}
    </BottomSheet>
  );
}
