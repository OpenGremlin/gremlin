/** Convert a hex color (e.g. "#f0f0f0") to its fully-transparent equivalent. */
export function hexToTransparent(hex: string): string {
  return hexWithAlpha(hex, 0);
}

/** Convert a hex color to rgba(...) at the given alpha (0–1). */
export function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Agent hue picker — fixed saturation/lightness so every hue reads clearly
// against light backgrounds while staying vivid. Tuned so that yellow
// (the hardest hue on white) still has enough contrast to read.
const AGENT_COLOR_SATURATION = 0.9;
const AGENT_COLOR_LIGHTNESS = 0.42;

/** Middle of the 0–360 hue range — a vivid teal used as the default. */
export const DEFAULT_AGENT_HEX_COLOR = hueToHex(180);

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}

/** Convert a hue (0–360) to a hex color at the agent-color saturation/lightness. */
export function hueToHex(hue: number): string {
  const [r, g, b] = hslToRgb(
    hue,
    AGENT_COLOR_SATURATION,
    AGENT_COLOR_LIGHTNESS,
  );
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** Extract a hue (0–360) from a hex color — used to initialize the picker. */
export function hexToHue(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 180;
  const r = Number.parseInt(h.substring(0, 2), 16) / 255;
  const g = Number.parseInt(h.substring(2, 4), 16) / 255;
  const b = Number.parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 180;
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

/**
 * Color to use when rendering an agent's name in the UI. Falls back to a
 * vivid teal when the agent predates the hue picker or was fetched via a
 * query that didn't select hexColor.
 */
export function agentNameColor(hexColor: string | null | undefined): string {
  return hexColor ?? DEFAULT_AGENT_HEX_COLOR;
}
