import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { getApiUrl } from "../lib/config";

/**
 * Hook that plays TTS audio for new agent messages when voice mode is on.
 *
 * Call `enqueue(logId)` when a new AGENT log arrives. The hook fetches the
 * on-demand `/api/speech/:logId` endpoint (which triggers server-side TTS,
 * cached after first generation) and plays the audio sequentially.
 */
export function useVoiceMode(enabled: boolean) {
  const { token } = useAuth();
  const queue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  const source = currentUrl
    ? {
        uri: currentUrl,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    : null;

  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const playNext = useCallback(() => {
    if (queue.current.length === 0) {
      isPlaying.current = false;
      setCurrentUrl(null);
      return;
    }

    const logId = queue.current.shift();
    if (!logId) return;
    const base = getApiUrl().replace(/\/$/, "");
    isPlaying.current = true;
    setCurrentUrl(`${base}/api/speech/${encodeURIComponent(logId)}`);
  }, []);

  // Auto-play when source changes and is loaded
  useEffect(() => {
    if (currentUrl && status.isLoaded && !status.playing) {
      player.play();
    }
  }, [currentUrl, status.isLoaded, status.playing, player]);

  // Advance queue when playback finishes
  useEffect(() => {
    if (status.didJustFinish) {
      playNext();
    }
  }, [status.didJustFinish, playNext]);

  const enqueue = useCallback(
    (logId: string) => {
      if (!enabled) return;
      queue.current.push(logId);
      if (!isPlaying.current) {
        playNext();
      }
    },
    [enabled, playNext],
  );

  // Clear queue when voice mode is disabled
  useEffect(() => {
    if (!enabled) {
      queue.current = [];
      isPlaying.current = false;
      setCurrentUrl(null);
      if (status.playing) player.pause();
    }
  }, [enabled, player, status.playing]);

  return { enqueue };
}
