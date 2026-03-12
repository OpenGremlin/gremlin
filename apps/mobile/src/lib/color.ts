/** Convert a hex color (e.g. "#f0f0f0") to its fully-transparent equivalent. */
export function hexToTransparent(hex: string): string {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0)`;
}
