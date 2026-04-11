export interface PreviewState {
  activeUrl: string | null;
  playing: boolean;
  paused: boolean;
  loading: boolean;
}

export type ToggleAction =
  | { type: "play"; url: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "noop" };

export function decideToggleAction(
  tappedUrl: string,
  state: Pick<PreviewState, "activeUrl" | "playing" | "paused">,
): ToggleAction {
  if (state.activeUrl === tappedUrl) {
    if (state.playing) return { type: "pause" };
    if (state.paused) return { type: "resume" };
    return { type: "noop" };
  }
  return { type: "play", url: tappedUrl };
}

/** True when the picker should clear its activeUrl (playback ended naturally). */
export function shouldClearActive(state: PreviewState): boolean {
  return (
    state.activeUrl !== null &&
    !state.playing &&
    !state.paused &&
    !state.loading
  );
}
