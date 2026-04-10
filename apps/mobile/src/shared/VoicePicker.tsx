import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Check, Pause, Play, Volume2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SpeechVoicesQuery } from "../graphql/queries";
import { useAuth } from "../lib/AuthContext";
import { execute } from "../lib/apolloClient";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { BottomSheet } from "./BottomSheet";

type Voice = {
  id: string;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
};

function PreviewButton({
  url,
  activePreview,
  setActivePreview,
}: {
  url: string;
  activePreview: string | null;
  setActivePreview: (url: string | null) => void;
}) {
  const colors = useNavigationTheme();
  const { token } = useAuth();
  const isActive = activePreview === url;

  const player = useAudioPlayer(
    isActive
      ? {
          uri: url,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      : null,
    { updateInterval: 0.25 },
  );
  const status = useAudioPlayerStatus(player);

  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isActive) {
      hasStarted.current = false;
      if (status.playing) player.pause();
    }
  }, [isActive, status.playing, player]);

  useEffect(() => {
    if (isActive && status.isLoaded && !hasStarted.current) {
      hasStarted.current = true;
      player.play();
    }
  }, [isActive, status.isLoaded, player]);

  useEffect(() => {
    if (
      isActive &&
      hasStarted.current &&
      status.isLoaded &&
      !status.playing &&
      status.currentTime >= status.duration
    ) {
      setActivePreview(null);
    }
  }, [
    isActive,
    status.isLoaded,
    status.playing,
    status.currentTime,
    status.duration,
    setActivePreview,
  ]);

  const toggle = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (isActive) {
        player.pause();
        setActivePreview(null);
      } else {
        setActivePreview(url);
      }
    },
    [isActive, player, url, setActivePreview],
  );

  const loading = isActive && !status.isLoaded;

  return (
    <Pressable
      onPress={toggle}
      hitSlop={4}
      style={
        isActive && status.playing
          ? { backgroundColor: `${colors.accentIndicator}20` }
          : undefined
      }
      className={`w-8 h-8 items-center justify-center rounded-full ${isActive && status.playing ? "" : "bg-surface"}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.accentIndicator} />
      ) : isActive && status.playing ? (
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
}

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
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreview, setActivePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!connectionId || !visible) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    execute(SpeechVoicesQuery, { connectionId }).then((result) => {
      if (cancelled) return;
      setVoices(result.speechVoices);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [connectionId, visible]);

  return (
    <BottomSheet visible={visible} title="Choose Voice" onDismiss={onDismiss}>
      {loading ? (
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
                {item.previewUrl ? (
                  <PreviewButton
                    url={item.previewUrl}
                    activePreview={activePreview}
                    setActivePreview={setActivePreview}
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
