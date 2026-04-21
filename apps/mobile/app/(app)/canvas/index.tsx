import { router } from "expo-router";
import { Cast, Globe } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import { createCanvasSession } from "../../../src/lib/canvasApi";
import {
  castToDevice,
  isCastAvailable,
  useDiscoveredDevices,
} from "../../../src/lib/castSession";
import { getApiUrl } from "../../../src/lib/config";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { TabScrollView } from "../../../src/shared/TabScrollView";

export default function CanvasPickerScreen() {
  const colors = useNavigationTheme();
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const castEnabled = isCastAvailable();
  const devices = useDiscoveredDevices();

  const handleCastDevice = async (device: {
    deviceId: string;
    friendlyName: string;
  }) => {
    if (pendingTarget) return;
    setPendingTarget(device.deviceId);
    try {
      const session = await createCanvasSession(device.friendlyName);
      await castToDevice(device.deviceId, session, getApiUrl());
      router.push({
        pathname: "/canvas/[sessionId]",
        params: { sessionId: session.sessionId },
      });
    } finally {
      setPendingTarget(null);
    }
  };

  const handleOpenInBrowser = async () => {
    if (pendingTarget) return;
    setPendingTarget("Browser");
    try {
      const session = await createCanvasSession("Browser");
      // Fire and forget the share sheet — user picks Copy / Messages /
      // AirDrop. Whether they share or cancel, we still navigate to
      // the device detail screen so they can pick an agent.
      Share.share({
        url: session.browserUrl,
        message: session.browserUrl,
        title: "Open canvas",
      }).catch(() => {});
      router.push({
        pathname: "/canvas/[sessionId]",
        params: { sessionId: session.sessionId },
      });
    } finally {
      setPendingTarget(null);
    }
  };

  return (
    <TabScrollView contentContainerClassName="px-4 pt-3 gap-4 grow">
      {castEnabled && (
        <>
          <Text className="text-text-secondary text-sm px-1">Cast to</Text>
          {devices.length === 0 ? (
            <View className="flex-row items-center gap-3 px-4 py-4 rounded-xl bg-surface-raised">
              <ActivityIndicator color={colors.iconMuted} />
              <Text className="text-text-secondary text-sm">
                Searching for devices…
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {devices.map((d) => (
                <Pressable
                  key={d.deviceId}
                  onPress={() => handleCastDevice(d)}
                  disabled={pendingTarget !== null}
                  className="flex-row items-center gap-3 p-4 rounded-xl bg-surface-raised active:opacity-70"
                >
                  <Cast size={20} color={colors.iconMuted} />
                  <View className="flex-1">
                    <Text className="text-text-primary text-base font-medium">
                      {d.friendlyName}
                    </Text>
                    {d.modelName && (
                      <Text className="text-text-muted text-xs mt-0.5">
                        {d.modelName}
                      </Text>
                    )}
                  </View>
                  {pendingTarget === d.deviceId && (
                    <ActivityIndicator color={colors.iconMuted} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          <View className="h-px bg-border my-2" />
        </>
      )}

      <Pressable
        onPress={handleOpenInBrowser}
        disabled={pendingTarget !== null}
        className="flex-row items-center gap-3 p-4 rounded-xl bg-surface-raised active:opacity-70"
      >
        <Globe size={20} color={colors.iconMuted} />
        <View className="flex-1">
          <Text className="text-text-primary text-base font-medium">
            Open on a browser
          </Text>
          <Text className="text-text-muted text-xs mt-0.5">
            Get a link you can open on any laptop, desktop, or smart TV
          </Text>
        </View>
        {pendingTarget === "Browser" && (
          <ActivityIndicator color={colors.iconMuted} />
        )}
      </Pressable>
    </TabScrollView>
  );
}
