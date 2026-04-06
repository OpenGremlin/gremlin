import { useSubscription } from "@apollo/client";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { SpeechStreamSubscription } from "../graphql/queries";
import { useAuth } from "../lib/AuthContext";

/**
 * Subscribe to sentence-level TTS audio from the server and play each
 * sentence sequentially using expo-audio.
 *
 * The server publishes signed URLs for each sentence as inference streams.
 * This hook receives those URLs, buffers them in order, and plays them
 * back-to-back — starting as soon as the first sentence is ready.
 */
export function useSpeechStream(
  scope: { agentId: string } | { taskId: string },
  enabled: boolean,
) {
  const { token } = useAuth();
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Ordered buffer: sentenceIndex → URL
  const buffer = useRef<Map<number, string>>(new Map());
  const nextToPlay = useRef(0);
  const isPlaying = useRef(false);
  const currentLogId = useRef<string | null>(null);

  // Single persistent player — source is swapped via replace() so the
  // player instance (and its event subscriptions) stays stable.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const playNext = useCallback(() => {
    const url = buffer.current.get(nextToPlay.current);
    if (url) {
      buffer.current.delete(nextToPlay.current);
      nextToPlay.current++;
      isPlaying.current = true;
      player.replace({
        uri: url,
        headers: tokenRef.current
          ? { Authorization: `Bearer ${tokenRef.current}` }
          : undefined,
      });
    } else {
      // Nothing queued yet — will resume when next chunk arrives
      isPlaying.current = false;
    }
  }, [player]);

  // Auto-play when a replaced source finishes loading
  useEffect(() => {
    if (isPlaying.current && status.isLoaded && !status.playing) {
      player.play();
    }
  }, [status.isLoaded, status.playing, player]);

  // Advance to next sentence when current finishes (native path)
  useEffect(() => {
    if (status.didJustFinish) {
      playNext();
    }
  }, [status.didJustFinish, playNext]);

  // Web fallback: expo-audio's web onended handler doesn't emit a status
  // update, so didJustFinish never becomes true. Poll the player directly
  // to detect when playback reaches the end of the track.
  useEffect(() => {
    if (Platform.OS !== "web" || !enabled) return;
    const id = setInterval(() => {
      if (
        isPlaying.current &&
        player.duration > 0 &&
        player.currentTime >= player.duration - 0.15
      ) {
        playNext();
      }
    }, 250);
    return () => clearInterval(id);
  }, [player, playNext, enabled]);

  // Subscribe to speech stream
  const variables =
    "taskId" in scope ? { taskId: scope.taskId } : { agentId: scope.agentId };

  useSubscription(SpeechStreamSubscription, {
    variables,
    skip: !enabled,
    onData: ({ data: { data } }) => {
      if (!data) return;
      const chunk = data.speechStream;

      // New message started — reset playback state
      if (chunk.logId !== currentLogId.current) {
        currentLogId.current = chunk.logId;
        buffer.current = new Map();
        nextToPlay.current = 0;
        isPlaying.current = false;
      }

      if (chunk.done) {
        return;
      }

      // Buffer the URL by sentence index
      buffer.current.set(chunk.sentenceIndex, chunk.url);

      // If not currently playing, try to start
      if (!isPlaying.current) {
        playNext();
      }
    },
  });

  // Clear state when disabled
  useEffect(() => {
    if (!enabled) {
      buffer.current = new Map();
      nextToPlay.current = 0;
      isPlaying.current = false;
      if (status.playing) player.pause();
    }
  }, [enabled, player, status.playing]);
}
