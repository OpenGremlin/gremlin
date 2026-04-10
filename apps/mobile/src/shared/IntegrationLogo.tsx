import { Image } from "expo-image";
import type { LucideIcon } from "lucide-react-native";
import {
  Database,
  FileCode2,
  FileText,
  Globe,
  ImageIcon,
  ScanText,
  Video,
  Workflow,
} from "lucide-react-native";
import { Text, View } from "react-native";
import { getApiUrl } from "../lib/config";
import { useTheme } from "../lib/ThemeContext";
import { useNavigationTheme } from "../lib/useNavigationTheme";

/**
 * Logo keys available from media-server.
 * Canonical list: packages/lib/src/services/media/index.ts (allLogoKeys)
 */
const logoKeys = new Set([
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
]);

/** Lucide icon fallbacks for skill icons that don't have SVG logos. */
const iconMap: Record<string, LucideIcon> = {
  database: Database,
  diagram: Workflow,
  "file-code": FileCode2,
  "file-text": FileText,
  globe: Globe,
  image: ImageIcon,
  scan: ScanText,
  video: Video,
};

/** Logos with complex SVG features (filters, masks) that need rasterization on native. */
const rasterizeKeys = new Set(["google_ai"]);

function buildLogoUrl(
  key: string,
  mode: "dark" | "light",
  size: number,
): string {
  const base = `${getApiUrl()}/media/logos/${key}_${mode}`;
  if (rasterizeKeys.has(key)) {
    // Omit .svg extension so expo-image uses the PNG response as-is
    return `${base}?width=${size * 3}&format=png`;
  }
  return `${base}.svg`;
}

export function IntegrationLogo({
  id,
  size = 40,
}: {
  id: string;
  size?: number;
}) {
  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const hasLogo = logoKeys.has(id);

  if (hasLogo) {
    const url = buildLogoUrl(id, isDark ? "dark" : "light", size);
    return (
      <View
        className="items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size }}
          contentFit="contain"
        />
      </View>
    );
  }

  const Icon = iconMap[id];
  if (Icon) {
    return (
      <View
        className="rounded-lg bg-surface-alt items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Icon size={size * 0.55} color={colors.iconDefault} />
      </View>
    );
  }

  return (
    <View
      className="rounded-full bg-surface-alt items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Text className="text-lg text-text-muted">{id[0]?.toUpperCase()}</Text>
    </View>
  );
}
