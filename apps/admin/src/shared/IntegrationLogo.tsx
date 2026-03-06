import * as logos from "../assets/logos";

export const logoMap: Record<string, string> = {
  google: logos.googleLogo,
  notion: logos.notionLogo,
  linear: logos.linearLogo,
  trello: logos.trelloLogo,
  slack: logos.slackLogo,
  discord: logos.discordLogo,
  teams: logos.teamsLogo,
  telegram: logos.telegramLogo,
  whatsapp: logos.whatsappLogo,
  github: logos.githubLogo,
  gitlab: logos.gitlabLogo,
  jira: logos.jiraLogo,
  spotify: logos.spotifyLogo,
  hue: logos.hueLogo,
  homeassistant: logos.homeAssistantLogo,
  anthropic: logos.anthropicLogo,
  openai: logos.openaiLogo,
  google_ai: logos.geminiLogo,
  mistral: logos.mistralLogo,
  deepseek: logos.deepseekLogo,
  xai: logos.xaiLogo,
  bedrock: logos.bedrockLogo,
  brave: logos.braveLogo,
};

export function IntegrationLogo({
  id,
  size = 10,
}: {
  id: string;
  size?: number;
}) {
  const logo = logoMap[id];
  const cls = `h-${size} w-${size}`;
  if (logo) {
    return (
      <div className={`${cls} flex items-center justify-center`}>
        <img src={logo} alt={id} className={`${cls} object-contain`} />
      </div>
    );
  }
  return (
    <div
      className={`${cls} rounded-full bg-neutral-800 flex items-center justify-center text-lg text-neutral-400`}
    >
      {id[0]?.toUpperCase()}
    </div>
  );
}
