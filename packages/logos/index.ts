/**
 * Logos that ship both a default (dark-mode) and a `_light` variant.
 * The default file (e.g. `Anthropic.svg`) is designed for dark backgrounds.
 * The `_light` file (e.g. `Anthropic_light.svg`) is designed for light backgrounds.
 */
export const logosWithLightVariant = new Set([
  "Anthropic",
  "GitHub",
  "Linear",
  "OpenAI",
  "xAI",
]);

/** All available logo base names (without extension or variant suffix). */
export const allLogos = [
  "Anthropic",
  "Bedrock",
  "Brave",
  "DeepSeek",
  "Discord",
  "Dropbox",
  "Gemini",
  "GitHub",
  "GitLab",
  "Google",
  "HomeAssistant",
  "Hue",
  "Jira",
  "Linear",
  "Mistral",
  "Notion",
  "OpenAI",
  "Slack",
  "Spotify",
  "Tavily",
  "Teams",
  "Telegram",
  "Trello",
  "WhatsApp",
  "xAI",
] as const;

export type LogoName = (typeof allLogos)[number];

/**
 * Returns the correct logo filename for a given name and color mode.
 *
 * @param name  Logo base name (e.g. "GitHub")
 * @param mode  "dark" for dark backgrounds, "light" for light backgrounds
 */
export function getLogoFilename(name: string, mode: "dark" | "light"): string {
  if (mode === "light" && logosWithLightVariant.has(name)) {
    return `${name}_light.svg`;
  }
  return `${name}.svg`;
}
