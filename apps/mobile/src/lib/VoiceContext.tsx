import { useApolloClient } from "@apollo/client";
import {
  type AudioPlayer,
  setAudioModeAsync,
  useAudioPlayer,
} from "expo-audio";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SpeechStreamSubscription } from "../graphql/queries";
import { useAuth } from "./AuthContext";
import { useLocalSettings } from "./LocalSettingsContext";

interface VoiceContextValue {
  /** Start listening for speech events on the given scope. */
  subscribe: (scope: { agentId: string } | { taskId: string }) => void;
  /** Stop listening and clear the queue. */
  unsubscribe: () => void;
  /** Play an ordered array of audio URLs using the double-buffered queue. */
  playUrls: (urls: string[]) => void;
  /** Pause playback without clearing the queue. */
  pause: () => void;
  /** Resume playback from where it was paused. */
  resume: () => void;
  /** Whether audio is currently playing (not paused). */
  playing: boolean;
  /** Whether playback is paused (can be resumed). */
  paused: boolean;
  /** True after play() is requested but before the native player is audible. */
  loading: boolean;
}

const VoiceContext = createContext<VoiceContextValue>({
  subscribe: () => {},
  playUrls: () => {},
  pause: () => {},
  resume: () => {},
  playing: false,
  paused: false,
  loading: false,
  unsubscribe: () => {},
});

// ── Double-buffer helpers ────────────────────────────────────────────
// Two players alternate: while one plays, the other pre-loads the next
// sentence. On finish, the buffered player starts instantly (no load
// latency) and the roles swap.

interface AudioSource {
  uri: string;
  headers?: Record<string, string>;
}

function preload(player: AudioPlayer, source: AudioSource) {
  player.pause();
  player.replace(source);
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { voiceEnabled } = useLocalSettings();
  const { token } = useAuth();
  const client = useApolloClient();

  // Reactive playing/paused state for UI consumers
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);

  // Watchdog: if the native player never reports status.playing (e.g. network
  // failure loading a source), clear `loading` after a timeout so the UI
  // doesn't hang on a spinner forever.
  const loadingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armLoading = useCallback(() => {
    setLoading(true);
    if (loadingWatchdogRef.current) clearTimeout(loadingWatchdogRef.current);
    loadingWatchdogRef.current = setTimeout(() => {
      setLoading(false);
      loadingWatchdogRef.current = null;
    }, 10_000);
  }, []);
  const disarmLoading = useCallback(() => {
    setLoading(false);
    if (loadingWatchdogRef.current) {
      clearTimeout(loadingWatchdogRef.current);
      loadingWatchdogRef.current = null;
    }
  }, []);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
    });
  }, []);

  // Two players for double-buffering
  const playerA = useAudioPlayer(null);
  const playerB = useAudioPlayer(null);

  // All mutable state lives in a single ref object to avoid stale closures
  // and to survive React StrictMode remount cycles.
  const state = useRef({
    buffer: new Map<number, string>(),
    nextToPlay: 0,
    isPlaying: false,
    currentLogId: null as string | null,
    maxSeenIndex: -1,
    // Double-buffer: which player is active, which is on-deck
    active: null as AudioPlayer | null,
    onDeck: null as AudioPlayer | null,
    onDeckLoaded: false,
  });

  // Keep reactive values in refs so callbacks stay stable
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  // Subscription handle so we can tear it down on scope change
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  // Track current scope so we can re-subscribe when voice is toggled on
  const scopeRef = useRef<{ agentId: string } | { taskId: string } | null>(
    null,
  );

  const makeSource = useCallback((url: string): AudioSource => {
    return {
      uri: url,
      headers: tokenRef.current
        ? { Authorization: `Bearer ${tokenRef.current}` }
        : undefined,
    };
  }, []);

  const resetState = useCallback(() => {
    state.current.buffer = new Map();
    state.current.nextToPlay = 0;
    state.current.isPlaying = false;
    state.current.currentLogId = null;
    state.current.maxSeenIndex = -1;
    state.current.active = null;
    state.current.onDeck = null;
    state.current.onDeckLoaded = false;
    setPlaying(false);
    setPaused(false);
    disarmLoading();
  }, [disarmLoading]);

  /** Try to pre-load the next sentence into the on-deck player. */
  const bufferNext = useCallback(() => {
    const s = state.current;
    if (s.onDeckLoaded || !s.onDeck) return;
    const url = s.buffer.get(s.nextToPlay);
    if (!url) return;
    s.buffer.delete(s.nextToPlay);
    s.nextToPlay++;
    s.onDeckLoaded = true;
    preload(s.onDeck, makeSource(url));
  }, [makeSource]);

  /** Swap active ↔ on-deck and start the on-deck player. */
  const advance = useCallback(() => {
    const s = state.current;
    if (s.onDeckLoaded && s.onDeck) {
      // Swap roles
      const prev = s.active;
      s.active = s.onDeck;
      s.onDeck = prev;
      s.onDeckLoaded = false;
      s.active.play();
      // Immediately try to pre-load the next sentence
      bufferNext();
    } else {
      // Nothing buffered — try to load directly into the on-deck slot
      // and play it immediately when ready.
      const url = s.buffer.get(s.nextToPlay);
      if (url) {
        s.buffer.delete(s.nextToPlay);
        s.nextToPlay++;
        // Swap so on-deck becomes active
        const prev = s.active;
        s.active = s.onDeck;
        s.onDeck = prev;
        s.onDeckLoaded = false;
        if (s.active) {
          preload(s.active, makeSource(url));
          s.active.play();
          armLoading();
          // Pre-load the next sentence into the on-deck player
          bufferNext();
        }
      } else {
        s.isPlaying = false;
        s.active = null;
        s.onDeck = null;
        setPlaying(false);
        setPaused(false);
      }
    }
  }, [bufferNext, makeSource, armLoading]);

  /** Kick off playback from idle — load into player A and start. */
  const playFirst = useCallback(() => {
    const s = state.current;
    const url = s.buffer.get(s.nextToPlay);
    if (!url) return;
    s.buffer.delete(s.nextToPlay);
    s.nextToPlay++;
    s.isPlaying = true;
    s.active = playerA;
    s.onDeck = playerB;
    s.onDeckLoaded = false;
    preload(playerA, makeSource(url));
    playerA.play();
    setPlaying(true);
    armLoading();
    // Pre-load next sentence into the on-deck player
    bufferNext();
  }, [playerA, playerB, makeSource, bufferNext, armLoading]);

  // Native: advance on didJustFinish, clear loading when audio actually starts
  useEffect(() => {
    const handle =
      (player: AudioPlayer) =>
      (status: { didJustFinish?: boolean; playing?: boolean }) => {
        if (state.current.active !== player) return;
        if (status.playing) disarmLoading();
        if (status.didJustFinish && state.current.isPlaying) {
          advance();
        }
      };
    const subA = playerA.addListener("playbackStatusUpdate", handle(playerA));
    const subB = playerB.addListener("playbackStatusUpdate", handle(playerB));
    return () => {
      subA.remove();
      subB.remove();
    };
  }, [playerA, playerB, advance, disarmLoading]);

  // Web fallback: poll for track end since expo-audio's web implementation
  // doesn't emit didJustFinish status updates.
  useEffect(() => {
    if (process.env.EXPO_OS !== "web") return;
    const id = setInterval(() => {
      const s = state.current;
      if (!s.isPlaying || !s.active) return;
      if (
        s.active.duration > 0 &&
        s.active.currentTime >= s.active.duration - 0.15
      ) {
        advance();
      }
    }, 250);
    return () => clearInterval(id);
  }, [advance]);

  const handleChunk = useCallback(
    (chunk: {
      logId: string;
      sentenceIndex: number;
      url: string;
      done: boolean;
    }) => {
      const s = state.current;

      // New message — reset
      if (chunk.logId !== s.currentLogId) {
        s.currentLogId = chunk.logId;
        s.buffer = new Map();
        s.nextToPlay = 0;
        s.isPlaying = false;
        s.maxSeenIndex = -1;
        s.active = null;
        s.onDeck = null;
        s.onDeckLoaded = false;
        playerA.pause();
        playerB.pause();
      }

      if (chunk.done) return;

      // Deduplicate re-delivered events
      if (chunk.sentenceIndex <= s.maxSeenIndex) return;
      s.maxSeenIndex = chunk.sentenceIndex;

      s.buffer.set(chunk.sentenceIndex, chunk.url);

      if (!s.isPlaying) {
        playFirst();
      } else {
        // Already playing — try to pre-load into the on-deck slot
        bufferNext();
      }
    },
    [playerA, playerB, playFirst, bufferNext],
  );

  const startSubscription = useCallback(
    (scope: { agentId: string } | { taskId: string }) => {
      subRef.current?.unsubscribe();
      subRef.current = null;

      const variables =
        "taskId" in scope
          ? { taskId: scope.taskId }
          : { agentId: scope.agentId };

      const observable = client.subscribe({
        query: SpeechStreamSubscription,
        variables,
      });

      subRef.current = observable.subscribe({
        next: ({ data }) => {
          if (data?.speechStream) {
            handleChunk(data.speechStream);
          }
        },
      });
    },
    [client, handleChunk],
  );

  // subscribe/unsubscribe are stable — they read voiceEnabled from a ref
  // so useSpeechStream's effect deps don't churn on voice toggle.
  const subscribe = useCallback(
    (scope: { agentId: string } | { taskId: string }) => {
      scopeRef.current = scope;
      resetState();

      if (voiceEnabledRef.current) {
        startSubscription(scope);
      }
    },
    [resetState, startSubscription],
  );

  // Ref to track fade-out interval so we can cancel it on re-entry
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unsubscribe = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    scopeRef.current = null;

    // Fade audio to zero over ~2s, then fully stop
    if (state.current.isPlaying && state.current.active) {
      const active = state.current.active;
      const onDeck = state.current.onDeck;
      const startVolume = active.volume;
      const steps = 40;
      const stepMs = 50;
      let step = 0;

      // Mark as stopped immediately so advance() doesn't fire
      resetState();

      if (fadeRef.current) clearInterval(fadeRef.current);
      fadeRef.current = setInterval(() => {
        step++;
        const vol = startVolume * (1 - step / steps);
        active.volume = Math.max(0, vol);
        if (step >= steps) {
          if (fadeRef.current) clearInterval(fadeRef.current);
          fadeRef.current = null;
          active.pause();
          active.volume = 1;
          onDeck?.pause();
          if (onDeck) onDeck.volume = 1;
        }
      }, stepMs);
    } else {
      resetState();
      playerA.pause();
      playerB.pause();
    }
  }, [playerA, playerB, resetState]);

  /** Play an ordered array of pre-built audio URLs (e.g. on-demand TTS). */
  const playUrls = useCallback(
    (urls: string[]) => {
      // Cancel any in-flight fade and restore volume
      if (fadeRef.current) {
        clearInterval(fadeRef.current);
        fadeRef.current = null;
        playerA.volume = 1;
        playerB.volume = 1;
      }
      // Stop any in-flight streaming playback
      subRef.current?.unsubscribe();
      subRef.current = null;
      resetState();
      playerA.pause();
      playerB.pause();

      // Feed all URLs into the buffer and kick off playback
      const s = state.current;
      s.currentLogId = `ondemand-${Date.now()}`;
      for (let i = 0; i < urls.length; i++) {
        s.buffer.set(i, urls[i]);
        s.maxSeenIndex = i;
      }
      playFirst();
    },
    [resetState, playerA, playerB, playFirst],
  );

  // When voice is toggled, start or stop the subscription for the
  // current scope without re-running useSpeechStream's effect.
  useEffect(() => {
    if (voiceEnabled && scopeRef.current && !subRef.current) {
      startSubscription(scopeRef.current);
    } else if (!voiceEnabled) {
      subRef.current?.unsubscribe();
      subRef.current = null;
      resetState();
      playerA.pause();
      playerB.pause();
    }
  }, [voiceEnabled, startSubscription, resetState, playerA, playerB]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      subRef.current?.unsubscribe();
      if (fadeRef.current) clearInterval(fadeRef.current);
      if (loadingWatchdogRef.current) clearTimeout(loadingWatchdogRef.current);
    };
  }, []);

  const pause = useCallback(() => {
    if (!state.current.isPlaying) return;
    state.current.active?.pause();
    state.current.isPlaying = false;
    setPlaying(false);
    setPaused(true);
    disarmLoading();
  }, [disarmLoading]);

  const resume = useCallback(() => {
    if (state.current.isPlaying) return;
    if (state.current.active) {
      state.current.isPlaying = true;
      state.current.active.play();
      setPlaying(true);
      setPaused(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      subscribe,
      unsubscribe,
      playUrls,
      pause,
      resume,
      playing,
      paused,
      loading,
    }),
    [subscribe, unsubscribe, playUrls, pause, resume, playing, paused, loading],
  );

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
