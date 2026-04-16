import { useEvent } from "expo";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pause, Play } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useAuth } from "../lib/AuthContext";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { DelayedSpinner } from "./DelayedSpinner";

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const THUMB_SIZE = 18;
const THUMB_ACTIVE_SCALE = 1.3;

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
  const barWidth = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const thumbScale = useSharedValue(1);
  const dragProgress = useSharedValue(progress);

  // Sync shared value when not dragging
  useDerivedValue(() => {
    if (!isDragging.value) {
      dragProgress.value = progress;
    }
  });

  const pan = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-10, 10])
    .onStart((e) => {
      isDragging.value = true;
      thumbScale.value = withSpring(THUMB_ACTIVE_SCALE, { damping: 15 });
      dragProgress.value = Math.max(0, Math.min(1, e.x / barWidth.value));
    })
    .onUpdate((e) => {
      dragProgress.value = Math.max(0, Math.min(1, e.x / barWidth.value));
    })
    .onFinalize(() => {
      isDragging.value = false;
      thumbScale.value = withSpring(1, { damping: 15 });
      runOnJS(onSeek)(dragProgress.value * duration);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    const ratio = Math.max(0, Math.min(1, e.x / barWidth.value));
    runOnJS(onSeek)(ratio * duration);
  });

  const gesture = Gesture.Race(pan, tap);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragProgress.value * barWidth.value - THUMB_SIZE / 2 },
      { scale: thumbScale.value },
    ],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${dragProgress.value * 100}%`,
  }));

  return (
    <View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          onLayout={(e: LayoutChangeEvent) => {
            barWidth.value = e.nativeEvent.layout.width;
          }}
          className="h-10 justify-center"
        >
          <View className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <Animated.View
              style={[fillStyle, { backgroundColor: colors.accentIndicator }]}
              className="h-full rounded-full"
            />
          </View>
          <Animated.View
            style={[
              {
                position: "absolute",
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: colors.accentIndicator,
              },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </GestureDetector>
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

/**
 * On native, AVFoundation doesn't reliably forward custom HTTP headers
 * (like Authorization) on audio/video sub-requests. We download the file
 * first and play from a local URI. On web, we pass headers directly.
 */
function useLocalMediaUri(
  url: string,
  token: string | null,
  fallbackExt: string,
): { uri: string | null; error: boolean } {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (Platform.OS === "web") return;

    let cancelled = false;
    setLocalUri(null);
    setError(false);

    const ext = new URL(url).pathname.split(".").pop() ?? fallbackExt;
    const dest = new File(Paths.cache, `media_${Date.now()}.${ext}`);

    File.downloadFileAsync(url, dest, {
      headers: tokenRef.current
        ? { Authorization: `Bearer ${tokenRef.current}` }
        : undefined,
    })
      .then((file) => {
        if (!cancelled) setLocalUri(file.uri);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      dest.delete();
    };
  }, [url, fallbackExt]);

  return { uri: localUri, error };
}

function useMediaSource(
  url: string,
  token: string | null,
  localUri: string | null,
) {
  return useMemo(() => {
    if (Platform.OS === "web") {
      return {
        uri: url,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      };
    }
    return localUri ? { uri: localUri } : null;
  }, [url, token, localUri]);
}

export function AudioPlayer({ url, title }: { url: string; title?: string }) {
  const { token } = useAuth();
  const colors = useNavigationTheme();
  const { uri: localUri, error: downloadError } = useLocalMediaUri(
    url,
    token,
    "mp3",
  );
  const source = useMediaSource(url, token, localUri);

  const player = useAudioPlayer(source, { updateInterval: 0.25 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!status.isLoaded) return;
    player.setActiveForLockScreen(true, { title: title ?? "Audio" });
    return () => {
      player.pause();
      player.clearLockScreenControls();
    };
  }, [player, status.isLoaded, title]);

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

  if (downloadError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">Unable to load audio</Text>
      </View>
    );
  }

  if (!source || !status.isLoaded) {
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

export function VideoPlayer({ url, title }: { url: string; title?: string }) {
  const { token } = useAuth();
  const { uri: localUri, error: downloadError } = useLocalMediaUri(
    url,
    token,
    "mp4",
  );
  const source = useMediaSource(url, token, localUri);

  const videoSource = useMemo(
    () =>
      source ? { ...source, metadata: title ? { title } : undefined } : null,
    [source, title],
  );

  const player = useVideoPlayer(videoSource, (p) => {
    p.showNowPlayingNotification = true;
    p.staysActiveInBackground = true;
  });

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  if (downloadError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-text-muted text-sm">Unable to load video</Text>
      </View>
    );
  }

  if (!source || status === "loading") {
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
