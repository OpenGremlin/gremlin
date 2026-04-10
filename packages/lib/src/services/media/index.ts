export const allLogoKeys = [
  "anthropic",
  "aws",
  "bedrock",
  "brave",
  "cohere",
  "deepseek",
  "discord",
  "dropbox",
  "elevenlabs",
  "fireworks",
  "github",
  "gitlab",
  "google",
  "google_ai",
  "groq",
  "homeassistant",
  "hue",
  "jira",
  "linear",
  "minimax",
  "mistral",
  "notion",
  "openai",
  "perplexity",
  "qwen",
  "slack",
  "spotify",
  "tavily",
  "teams",
  "telegram",
  "together",
  "trello",
  "whatsapp",
  "xai",
] as const;

export type LogoKey = (typeof allLogoKeys)[number];

export function buildMediaUrl(
  cdnBase: string,
  path: string,
  width?: number | null,
): string {
  const relativePath = path.replace(/^\/+/, "");
  const url = new URL(
    relativePath,
    cdnBase.endsWith("/") ? cdnBase : `${cdnBase}/`,
  );
  if (width) url.searchParams.set("width", String(width));
  return url.toString();
}

export const mediaService = { buildMediaUrl };

export type MediaService = typeof mediaService;
