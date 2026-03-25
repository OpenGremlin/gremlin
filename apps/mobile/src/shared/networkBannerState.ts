export type BannerState = "hidden" | "offline";

export function deriveBannerState(isConnected: boolean): BannerState {
  return isConnected ? "hidden" : "offline";
}
