import { Image, Text, View } from "react-native";

/* eslint-disable @typescript-eslint/no-var-requires */
const logoMap: Record<string, ReturnType<typeof require>> = {
  google: require("@gremlin/logos/Google.svg"),
  notion: require("@gremlin/logos/Notion.svg"),
  linear: require("@gremlin/logos/Linear.svg"),
  trello: require("@gremlin/logos/Trello.svg"),
  slack: require("@gremlin/logos/Slack.svg"),
  discord: require("@gremlin/logos/Discord.svg"),
  teams: require("@gremlin/logos/Teams.svg"),
  telegram: require("@gremlin/logos/Telegram.svg"),
  whatsapp: require("@gremlin/logos/WhatsApp.svg"),
  github: require("@gremlin/logos/GitHub_white.svg"),
  gitlab: require("@gremlin/logos/GitLab.svg"),
  jira: require("@gremlin/logos/Jira.svg"),
  spotify: require("@gremlin/logos/Spotify.svg"),
  hue: require("@gremlin/logos/Hue.svg"),
  homeassistant: require("@gremlin/logos/HomeAssistant.svg"),
  anthropic: require("@gremlin/logos/Anthropic_white.svg"),
  openai: require("@gremlin/logos/OpenAI.svg"),
  google_ai: require("@gremlin/logos/Gemini.svg"),
  mistral: require("@gremlin/logos/Mistral.svg"),
  deepseek: require("@gremlin/logos/DeepSeek.svg"),
  xai: require("@gremlin/logos/xAI.svg"),
  bedrock: require("@gremlin/logos/Bedrock.svg"),
  brave: require("@gremlin/logos/Brave.svg"),
  tavily: require("@gremlin/logos/Tavily.svg"),
};

export function IntegrationLogo({
  id,
  size = 40,
}: {
  id: string;
  size?: number;
}) {
  const logo = logoMap[id];
  if (logo) {
    return (
      <View
        className="items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Image
          source={logo}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    );
  }
  return (
    <View
      className="rounded-full bg-neutral-800 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Text className="text-lg text-neutral-400">{id[0]?.toUpperCase()}</Text>
    </View>
  );
}
