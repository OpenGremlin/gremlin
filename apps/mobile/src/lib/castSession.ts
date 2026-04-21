// Wrapper around react-native-google-cast. Native module is only
// available after `npx expo prebuild && npx expo run:ios|android`
// rebuilds the dev client. Until then, isCastAvailable() returns
// false and the canvas picker omits the Cast section.

import { useEffect, useState } from "react";
import { NativeModules } from "react-native";
import type { CanvasSessionInfo } from "./canvasApi";

const NAMESPACE = "urn:x-cast:com.opengremlin.canvas";

// react-native-google-cast registers under either name depending on
// platform / version.
export function isCastAvailable(): boolean {
  return !!(NativeModules.RNGoogleCast || NativeModules.GoogleCast);
}

export interface DiscoveredDevice {
  deviceId: string;
  friendlyName: string;
  modelName?: string;
}

let castLib: typeof import("react-native-google-cast") | null = null;
function loadLib(): typeof import("react-native-google-cast") | null {
  if (castLib) return castLib;
  if (!isCastAvailable()) return null;
  try {
    castLib = require("react-native-google-cast");
    return castLib;
  } catch {
    return null;
  }
}

export function useDiscoveredDevices(): DiscoveredDevice[] {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);

  useEffect(() => {
    const lib = loadLib();
    if (!lib) return;

    const Discovery = lib.default?.getDiscoveryManager?.();
    if (!Discovery) return;

    Discovery.startDiscovery().catch(() => {});
    const sub = Discovery.onDevicesUpdated((list: unknown[]) => {
      setDevices(
        list.map((d) => {
          const dev = d as {
            deviceId: string;
            friendlyName: string;
            modelName?: string;
          };
          return {
            deviceId: dev.deviceId,
            friendlyName: dev.friendlyName,
            modelName: dev.modelName,
          };
        }),
      );
    });

    return () => {
      sub?.remove?.();
      Discovery.stopDiscovery?.()?.catch?.(() => {});
    };
  }, []);

  return devices;
}

export interface CastLaunchPayload {
  version: 1;
  backendUrl: string;
  sessionId: string;
  token: string;
}

/** Start a Cast session against the given device and hand the canvas
 *  session info over via custom message. The receiver picks it up and
 *  opens the AG-UI stream against backendUrl. */
export async function castToDevice(
  deviceId: string,
  session: CanvasSessionInfo,
  backendUrl: string,
): Promise<void> {
  const lib = loadLib();
  if (!lib) throw new Error("Cast SDK not available — rebuild dev client");

  const SessionManager = lib.default?.getSessionManager?.();
  if (!SessionManager) throw new Error("Cast SessionManager unavailable");

  await SessionManager.startSession(deviceId);
  const castSession = await SessionManager.getCurrentCastSession();
  if (!castSession) throw new Error("Cast session failed to start");

  const channel = await castSession.addChannel(NAMESPACE);
  const payload: CastLaunchPayload = {
    version: 1,
    backendUrl,
    sessionId: session.sessionId,
    token: session.token,
  };
  await channel.sendMessage(payload);
}
