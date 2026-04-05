import { useSubscription } from "@apollo/client";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
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

  // Ordered buffer: sentenceIndex → URL
  const buffer = useRef<Map<number, string>>(new Map());
  const nextToPlay = useRef(0);
  const streamDone = useRef(false);
  const isPlaying = useRef(false);
  const currentLogId = useRef<string | null>(null);

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
    const url = buffer.current.get(nextToPlay.current);
    if (url) {
      buffer.current.delete(nextToPlay.current);
      nextToPlay.current++;
      isPlaying.current = true;
      setCurrentUrl(url);
    } else {
      // Nothing queued — if stream is done, we're finished
      isPlaying.current = false;
      setCurrentUrl(null);
    }
  }, []);

  // Auto-play when source changes and is loaded
  useEffect(() => {
    if (currentUrl && status.isLoaded && !status.playing) {
      player.play();
    }
  }, [currentUrl, status.isLoaded, status.playing, player]);

  // Advance to next sentence when current finishes
  useEffect(() => {
    if (status.didJustFinish) {
      playNext();
    }
  }, [status.didJustFinish, playNext]);

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
        streamDone.current = false;
        isPlaying.current = false;
      }

      if (chunk.done) {
        streamDone.current = true;
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
      streamDone.current = false;
      isPlaying.current = false;
      setCurrentUrl(null);
      if (status.playing) player.pause();
    }
  }, [enabled, player, status.playing]);
}
