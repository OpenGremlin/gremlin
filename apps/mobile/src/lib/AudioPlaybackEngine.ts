import type { AudioPlayer } from "expo-audio";

interface AudioSource {
  uri: string;
  headers?: Record<string, string>;
}

export type StatusCallback = (status: {
  playing: boolean;
  paused: boolean;
  loading: boolean;
}) => void;

/**
 * Double-buffered audio playback engine.
 * Two players alternate: while one plays, the other pre-loads the next
 * sentence. On finish, the buffered player starts instantly and roles swap.
 */
export class AudioPlaybackEngine {
  private buffer = new Map<number, string>();
  private nextToPlay = 0;
  private isPlaying = false;
  private currentLogId: string | null = null;
  private maxSeenIndex = -1;
  private active: AudioPlayer | null = null;
  private onDeck: AudioPlayer | null = null;
  private onDeckLoaded = false;
  private loadingWatchdog: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private playerA: AudioPlayer,
    private playerB: AudioPlayer,
    private makeSource: (url: string) => AudioSource,
    private onStatus: StatusCallback,
  ) {}

  private preload(player: AudioPlayer, source: AudioSource) {
    player.pause();
    player.replace(source);
  }

  private armLoading() {
    this.onStatus({ playing: true, paused: false, loading: true });
    if (this.loadingWatchdog) clearTimeout(this.loadingWatchdog);
    this.loadingWatchdog = setTimeout(() => {
      this.onStatus({ playing: this.isPlaying, paused: false, loading: false });
      this.loadingWatchdog = null;
    }, 10_000);
  }

  private disarmLoading() {
    if (this.loadingWatchdog) {
      clearTimeout(this.loadingWatchdog);
      this.loadingWatchdog = null;
    }
  }

  private emitStatus(playing: boolean, paused: boolean) {
    this.disarmLoading();
    this.onStatus({ playing, paused, loading: false });
  }

  /** Try to pre-load the next sentence into the on-deck player. */
  private bufferNext() {
    if (this.onDeckLoaded || !this.onDeck) return;
    const url = this.buffer.get(this.nextToPlay);
    if (!url) return;
    this.buffer.delete(this.nextToPlay);
    this.nextToPlay++;
    this.onDeckLoaded = true;
    this.preload(this.onDeck, this.makeSource(url));
  }

  /** Swap active ↔ on-deck and start the on-deck player. */
  advance() {
    if (this.onDeckLoaded && this.onDeck) {
      const prev = this.active;
      this.active = this.onDeck;
      this.onDeck = prev;
      this.onDeckLoaded = false;
      this.active.play();
      this.bufferNext();
    } else {
      const url = this.buffer.get(this.nextToPlay);
      if (url) {
        this.buffer.delete(this.nextToPlay);
        this.nextToPlay++;
        const prev = this.active;
        this.active = this.onDeck;
        this.onDeck = prev;
        this.onDeckLoaded = false;
        if (this.active) {
          this.preload(this.active, this.makeSource(url));
          this.active.play();
          this.armLoading();
          this.bufferNext();
        }
      } else {
        this.isPlaying = false;
        this.active = null;
        this.onDeck = null;
        this.emitStatus(false, false);
      }
    }
  }

  /** Kick off playback from idle. */
  private playFirst() {
    const url = this.buffer.get(this.nextToPlay);
    if (!url) return;
    this.buffer.delete(this.nextToPlay);
    this.nextToPlay++;
    this.isPlaying = true;
    this.active = this.playerA;
    this.onDeck = this.playerB;
    this.onDeckLoaded = false;
    this.preload(this.playerA, this.makeSource(url));
    this.playerA.play();
    this.armLoading();
    this.bufferNext();
  }

  /** Handle a speech chunk from the subscription. */
  handleChunk(chunk: {
    logId: string;
    sentenceIndex: number;
    url: string;
    done: boolean;
  }) {
    if (chunk.logId !== this.currentLogId) {
      this.currentLogId = chunk.logId;
      this.buffer = new Map();
      this.nextToPlay = 0;
      this.isPlaying = false;
      this.maxSeenIndex = -1;
      this.active = null;
      this.onDeck = null;
      this.onDeckLoaded = false;
      this.playerA.pause();
      this.playerB.pause();
    }

    if (chunk.done) return;
    if (chunk.sentenceIndex <= this.maxSeenIndex) return;
    this.maxSeenIndex = chunk.sentenceIndex;

    this.buffer.set(chunk.sentenceIndex, chunk.url);

    if (!this.isPlaying) {
      this.playFirst();
    } else {
      this.bufferNext();
    }
  }

  /** Play an ordered array of pre-built audio URLs (e.g. on-demand TTS). */
  playUrls(urls: string[]) {
    this.reset();
    this.playerA.pause();
    this.playerB.pause();

    this.currentLogId = `ondemand-${Date.now()}`;
    for (let i = 0; i < urls.length; i++) {
      this.buffer.set(i, urls[i]);
      this.maxSeenIndex = i;
    }
    this.playFirst();
  }

  pause() {
    if (!this.isPlaying) return;
    this.active?.pause();
    this.isPlaying = false;
    this.emitStatus(false, true);
  }

  resume() {
    if (this.isPlaying) return;
    if (this.active) {
      this.isPlaying = true;
      this.active.play();
      this.emitStatus(true, false);
    }
  }

  /** Called when a playback status update fires on a player. */
  onPlayerStatus(
    player: AudioPlayer,
    status: { didJustFinish?: boolean; playing?: boolean },
  ) {
    if (this.active !== player) return;
    if (status.playing) this.disarmLoading();
    if (status.didJustFinish && this.isPlaying) {
      this.advance();
    }
  }

  reset() {
    this.buffer = new Map();
    this.nextToPlay = 0;
    this.isPlaying = false;
    this.currentLogId = null;
    this.maxSeenIndex = -1;
    this.active = null;
    this.onDeck = null;
    this.onDeckLoaded = false;
    this.disarmLoading();
    this.emitStatus(false, false);
  }

  stop() {
    this.reset();
    this.playerA.pause();
    this.playerB.pause();
  }

  /** Whether the active player is currently playing. */
  get playing() {
    return this.isPlaying;
  }

  /** The currently active player (for web polling fallback). */
  get activePlayer() {
    return this.active;
  }

  cleanup() {
    if (this.loadingWatchdog) clearTimeout(this.loadingWatchdog);
  }
}
