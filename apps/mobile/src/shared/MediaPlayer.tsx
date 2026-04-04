import { useEvent } from "expo";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pause, Play } from "lucide-react-native";
import { useCallback, useMemo, useRef } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { DelayedSpinner } from "./DelayedSpinner";

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ProgressBar({
  position,
  duration,
  onSeek,
}: {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}) {
  const colors = useNavigationTheme();
  const progress = duration > 0 ? position / duration : 0;
  const barWidth = useRef(1);

  return (
    <View>
      <Pressable
        onLayout={(e: LayoutChangeEvent) => {
          barWidth.current = e.nativeEvent.layout.width;
        }}
        onPress={(e) => {
          const { locationX } = e.nativeEvent;
          const ratio = Math.max(0, Math.min(1, locationX / barWidth.current));
          onSeek(ratio * duration);
        }}
        className="h-6 justify-center"
      >
        <View className="h-1 rounded-full bg-surface-hover overflow-hidden">
          <View
            style={{
              width: `${progress * 100}%`,
              backgroundColor: colors.accentIndicator,
            }}
            className="h-full rounded-full"
          />
        </View>
      </Pressable>
      <View className="flex-row justify-between mt-0.5">
        <Text className="text-[10px] text-text-muted">
          {formatTime(position)}
        </Text>
        <Text className="text-[10px] text-text-muted">
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

export function AudioPlayer({ url }: { url: string }) {
  const { token } = useAuth();
  const colors = useNavigationTheme();

  const source = useMemo(
    () => ({
      uri: url,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    [url, token],
  );

  const player = useAudioPlayer(source, { updateInterval: 0.25 });
  const status = useAudioPlayerStatus(player);

  const togglePlay = useCallback(() => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, status.playing]);

  const seek = useCallback(
    (seconds: number) => {
      player.seekTo(seconds);
    },
    [player],
  );

  if (!status.isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <DelayedSpinner />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center bg-bg px-6">
      <ProgressBar
        position={status.currentTime}
        duration={status.duration}
        onSeek={seek}
      />

      <View className="flex-row justify-center mt-4">
        <Pressable
          onPress={togglePlay}
          className="w-14 h-14 rounded-full bg-surface items-center justify-center"
        >
          {status.playing ? (
            <Pause
              size={24}
              color={colors.headerText}
              fill={colors.headerText}
            />
          ) : (
            <Play
              size={24}
              color={colors.headerText}
              fill={colors.headerText}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function VideoPlayer({ url }: { url: string }) {
  const { token } = useAuth();

  const source = useMemo(
    () => ({
      uri: url,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    [url, token],
  );

  const player = useVideoPlayer(source);

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <DelayedSpinner />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <VideoView
        player={player}
        style={{ flex: 1 }}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}
