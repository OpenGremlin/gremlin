import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Pause, Play, Volume2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SpeechVoicesQuery } from "../../src/graphql/queries";
import { useAuth } from "../../src/lib/AuthContext";
import { execute } from "../../src/lib/apolloClient";
import { dismissSheet, useSheetPayload } from "../../src/lib/sheetStore";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";
import { Sheet } from "../../src/shared/Sheet";

export interface VoicePickerSheetPayload {
  providerId: string | undefined;
  currentVoice: string | null | undefined;
  onSelect: (voice: string) => void;
}

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

  // Stop when another preview becomes active
  useEffect(() => {
    if (!isActive && status.playing) {
      player.pause();
    }
  }, [isActive, status.playing, player]);

  // Auto-play when becoming active
  useEffect(() => {
    if (isActive && status.isLoaded && !status.playing) {
      player.play();
    }
  }, [isActive, status.isLoaded, status.playing, player.play]);

  // Clear active state when playback finishes
  useEffect(() => {
    if (
      isActive &&
      status.isLoaded &&
      !status.playing &&
      status.currentTime > 0 &&
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
      hitSlop={8}
      className="w-8 h-8 items-center justify-center rounded-full"
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.iconDefault} />
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

export default function VoicePickerSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payload = useSheetPayload<VoicePickerSheetPayload>(id);
  const colors = useNavigationTheme();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreview, setActivePreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (id) dismissSheet(id);
    };
  }, [id]);

  useEffect(() => {
    if (!payload?.providerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    execute(SpeechVoicesQuery, { providerId: payload.providerId }).then(
      (result) => {
        if (cancelled) return;
        setVoices(result.speechVoices);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [payload?.providerId]);

  if (!payload) return null;

  return (
    <Sheet title="Choose Voice">
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
            const selected = payload.currentVoice === item.id;
            return (
              <Pressable
                onPress={() => {
                  payload.onSelect(item.id);
                  router.back();
                }}
                className={`flex-row items-center gap-3 px-3 py-3 rounded-lg ${
                  selected ? "bg-surface-alt" : "active:bg-surface-alt"
                }`}
              >
                <Volume2
                  size={16}
                  color={selected ? colors.headerText : colors.iconDefault}
                />
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
                {item.previewUrl && (
                  <PreviewButton
                    url={item.previewUrl}
                    activePreview={activePreview}
                    setActivePreview={setActivePreview}
                  />
                )}
                {selected && <Check size={16} color={colors.headerText} />}
              </Pressable>
            );
          }}
        />
      )}
    </Sheet>
  );
}
