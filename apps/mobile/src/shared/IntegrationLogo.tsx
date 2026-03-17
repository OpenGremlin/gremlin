import { Image } from "expo-image";
import { Text, View } from "react-native";
import { useTheme } from "../lib/ThemeContext";

/* eslint-disable @typescript-eslint/no-var-requires */

/** Default logos — designed for dark backgrounds (dark mode). */
const darkLogoMap: Record<string, ReturnType<typeof require>> = {
  google: require("@gremlin/logos/Google.svg"),
  notion: require("@gremlin/logos/Notion.svg"),
  linear: require("@gremlin/logos/Linear.svg"),
  trello: require("@gremlin/logos/Trello.svg"),
  slack: require("@gremlin/logos/Slack.svg"),
  discord: require("@gremlin/logos/Discord.svg"),
  teams: require("@gremlin/logos/Teams.svg"),
  telegram: require("@gremlin/logos/Telegram.svg"),
  whatsapp: require("@gremlin/logos/WhatsApp.svg"),
  github: require("@gremlin/logos/GitHub.svg"),
  gitlab: require("@gremlin/logos/GitLab.svg"),
  jira: require("@gremlin/logos/Jira.svg"),
  spotify: require("@gremlin/logos/Spotify.svg"),
  hue: require("@gremlin/logos/Hue.svg"),
  homeassistant: require("@gremlin/logos/HomeAssistant.svg"),
  anthropic: require("@gremlin/logos/Anthropic.svg"),
  openai: require("@gremlin/logos/OpenAI.svg"),
  google_ai: require("@gremlin/logos/Gemini.svg"),
  mistral: require("@gremlin/logos/Mistral.svg"),
  deepseek: require("@gremlin/logos/DeepSeek.svg"),
  xai: require("@gremlin/logos/xAI.svg"),
  bedrock: require("@gremlin/logos/Bedrock.svg"),
  brave: require("@gremlin/logos/Brave.svg"),
  tavily: require("@gremlin/logos/Tavily.svg"),
  groq: require("@gremlin/logos/Groq.svg"),
  perplexity: require("@gremlin/logos/Perplexity.svg"),
  together: require("@gremlin/logos/TogetherAI.svg"),
  fireworks: require("@gremlin/logos/FireworksAI.svg"),
  cohere: require("@gremlin/logos/Cohere.svg"),
};

/** Light-mode overrides — only for logos that have a `_light` variant. */
const lightLogoOverrides: Record<string, ReturnType<typeof require>> = {
  anthropic: require("@gremlin/logos/Anthropic_light.svg"),
  github: require("@gremlin/logos/GitHub_light.svg"),
  linear: require("@gremlin/logos/Linear_light.svg"),
  openai: require("@gremlin/logos/OpenAI_light.svg"),
  xai: require("@gremlin/logos/xAI_light.svg"),
  groq: require("@gremlin/logos/Groq_light.svg"),
};

export function IntegrationLogo({
  id,
  size = 40,
}: {
  id: string;
  size?: number;
}) {
  const { isDark } = useTheme();
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
  return (
    <View
      className="rounded-full bg-surface-alt items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Text className="text-lg text-text-muted">{id[0]?.toUpperCase()}</Text>
    </View>
  );
}
