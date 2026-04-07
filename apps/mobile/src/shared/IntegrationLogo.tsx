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
import { useTheme } from "../lib/ThemeContext";
import { useNavigationTheme } from "../lib/useNavigationTheme";

/* eslint-disable @typescript-eslint/no-var-requires */

/** Default logos — designed for dark backgrounds (dark mode). */
const darkLogoMap: Record<string, ReturnType<typeof require>> = {
  google: require("@opengremlin/logos/Google.svg"),
  notion: require("@opengremlin/logos/Notion.svg"),
  linear: require("@opengremlin/logos/Linear.svg"),
  trello: require("@opengremlin/logos/Trello.svg"),
  slack: require("@opengremlin/logos/Slack.svg"),
  discord: require("@opengremlin/logos/Discord.svg"),
  dropbox: require("@opengremlin/logos/Dropbox.svg"),
  teams: require("@opengremlin/logos/Teams.svg"),
  telegram: require("@opengremlin/logos/Telegram.svg"),
  whatsapp: require("@opengremlin/logos/WhatsApp.svg"),
  github: require("@opengremlin/logos/GitHub.svg"),
  gitlab: require("@opengremlin/logos/GitLab.svg"),
  jira: require("@opengremlin/logos/Jira.svg"),
  spotify: require("@opengremlin/logos/Spotify.svg"),
  hue: require("@opengremlin/logos/Hue.svg"),
  homeassistant: require("@opengremlin/logos/HomeAssistant.svg"),
  anthropic: require("@opengremlin/logos/Anthropic.svg"),
  openai: require("@opengremlin/logos/OpenAI.svg"),
  google_ai: require("@opengremlin/logos/Gemini.svg"),
  mistral: require("@opengremlin/logos/Mistral.svg"),
  deepseek: require("@opengremlin/logos/DeepSeek.svg"),
  xai: require("@opengremlin/logos/xAI.svg"),
  aws: require("@opengremlin/logos/AWS.svg"),
  bedrock: require("@opengremlin/logos/Bedrock.svg"),
  brave: require("@opengremlin/logos/Brave.svg"),
  tavily: require("@opengremlin/logos/Tavily.svg"),
  groq: require("@opengremlin/logos/Groq.svg"),
  perplexity: require("@opengremlin/logos/Perplexity.svg"),
  together: require("@opengremlin/logos/TogetherAI.svg"),
  fireworks: require("@opengremlin/logos/FireworksAI.svg"),
  cohere: require("@opengremlin/logos/Cohere.svg"),
  minimax: require("@opengremlin/logos/MiniMax.svg"),
  qwen: require("@opengremlin/logos/Qwen.svg"),
  elevenlabs: require("@opengremlin/logos/ElevenLabs.svg"),
};

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

/** Light-mode overrides — only for logos that have a `_light` variant. */
const lightLogoOverrides: Record<string, ReturnType<typeof require>> = {
  aws: require("@opengremlin/logos/AWS_light.svg"),
  anthropic: require("@opengremlin/logos/Anthropic_light.svg"),
  github: require("@opengremlin/logos/GitHub_light.svg"),
  linear: require("@opengremlin/logos/Linear_light.svg"),
  openai: require("@opengremlin/logos/OpenAI_light.svg"),
  xai: require("@opengremlin/logos/xAI_light.svg"),
  groq: require("@opengremlin/logos/Groq_light.svg"),
  elevenlabs: require("@opengremlin/logos/ElevenLabs_light.svg"),
};

export function IntegrationLogo({
  id,
  size = 40,
}: {
  id: string;
  size?: number;
}) {
  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const logo =
    (!isDark ? lightLogoOverrides[id] : undefined) ?? darkLogoMap[id];

  if (logo) {
    return (
      <View
        className="items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Image
          source={logo}
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
