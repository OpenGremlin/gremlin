import { router, Stack, useLocalSearchParams } from "expo-router";
import { Airplay, Cast, Maximize, Minimize, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (process.env.EXPO_OS !== "web") return;
    ref.current = document.documentElement;
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = useCallback(async () => {
    if (process.env.EXPO_OS !== "web") return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by browser
    }
  }, []);

  return { isFullscreen, toggle };
}

function ToolbarButton({
  onPress,
  children,
  label,
}: {
  onPress: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded-xl bg-white/10 active:bg-white/20"
      style={{ width: 44, height: 44 }}
      accessibilityLabel={label}
    >
      {children}
    </Pressable>
  );
}

export default function AgentCanvasScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (!id) {
      router.back();
    }
  }, [id]);

  // Auto-hide controls after 4 seconds of inactivity
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  const handleClose = useCallback(async () => {
    if (process.env.EXPO_OS === "web" && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }
    router.back();
  }, []);

  const handleCast = useCallback((_type: "chromecast" | "airplay") => {
    // TODO: Implement cast session
  }, []);

  if (!id) return null;

  return (
    <Pressable
      className="flex-1 bg-black"
      onPress={resetHideTimer}
      style={{ cursor: "default" } as never}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />

      {/* Canvas area */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-white/30 text-base">Canvas</Text>
      </View>

      {/* Floating controls */}
      {showControls && (
        <View
          style={{
            position: "absolute",
            top: process.env.EXPO_OS === "ios" ? insets.top + 8 : 12,
            left: 12,
            right: 12,
          }}
          className="flex-row items-center justify-between"
        >
          {/* Close button */}
          <ToolbarButton onPress={handleClose} label="Close canvas">
            <X size={20} color="#fff" />
          </ToolbarButton>

          {/* Cast + fullscreen controls */}
          <View className="flex-row gap-2">
            <ToolbarButton
              onPress={() => handleCast("chromecast")}
              label="Cast to Chromecast"
            >
              <Cast size={20} color="#fff" />
            </ToolbarButton>

            {process.env.EXPO_OS === "ios" && (
              <ToolbarButton
                onPress={() => handleCast("airplay")}
                label="AirPlay"
              >
                <Airplay size={20} color="#fff" />
              </ToolbarButton>
            )}

            {process.env.EXPO_OS === "web" && (
              <ToolbarButton
                onPress={toggleFullscreen}
                label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize size={20} color="#fff" />
                ) : (
                  <Maximize size={20} color="#fff" />
                )}
              </ToolbarButton>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}
