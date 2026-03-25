export type BannerState = "hidden" | "offline" | "back-online";

export function deriveBannerState(
  isConnected: boolean,
  prev: BannerState,
): BannerState {
  if (!isConnected) return "offline";
  if (prev === "offline") return "back-online";
  return "hidden";
}
