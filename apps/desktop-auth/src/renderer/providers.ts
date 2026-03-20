import DiscordLogo from "@gremlin/logos/Discord.svg";
import DropboxLogo from "@gremlin/logos/Dropbox.svg";
import GitHubLogo from "@gremlin/logos/GitHub.svg";
import GitHubLightLogo from "@gremlin/logos/GitHub_light.svg";
import GitLabLogo from "@gremlin/logos/GitLab.svg";
import GoogleLogo from "@gremlin/logos/Google.svg";
import JiraLogo from "@gremlin/logos/Jira.svg";
import LinearLogo from "@gremlin/logos/Linear.svg";
import LinearLightLogo from "@gremlin/logos/Linear_light.svg";
import NotionLogo from "@gremlin/logos/Notion.svg";
import SpotifyLogo from "@gremlin/logos/Spotify.svg";
import TeamsLogo from "@gremlin/logos/Teams.svg";
import { type IntegrationProviderDef, providers } from "@gremlin/providers";

/** Map logo filenames to Vite-resolved asset URLs. */
const logoAssets: Record<string, string> = {
  "Google.svg": GoogleLogo,
  "Notion.svg": NotionLogo,
  "Linear.svg": LinearLogo,
  "Linear_light.svg": LinearLightLogo,
  "Discord.svg": DiscordLogo,
  "Dropbox.svg": DropboxLogo,
  "Teams.svg": TeamsLogo,
  "GitHub.svg": GitHubLogo,
  "GitHub_light.svg": GitHubLightLogo,
  "GitLab.svg": GitLabLogo,
  "Jira.svg": JiraLogo,
  "Spotify.svg": SpotifyLogo,
};

export type ProviderMeta = IntegrationProviderDef & {
  scopes: { scope: string; label: string }[];
  /** Resolved logo asset URL */
  logoUrl: string;
  /** Resolved light-mode logo asset URL */
  logoLightUrl?: string;
};

export function getLogoUrl(provider: ProviderMeta, isDark: boolean): string {
  if (!isDark && provider.logoLightUrl) return provider.logoLightUrl;
  return provider.logoUrl;
}

export const oauthProviders: ProviderMeta[] = providers
  .filter(
    (p) => p.connectionType === "oauth" && !p.hidden && logoAssets[p.logo],
  )
  .map((p) => ({
    ...p,
    scopes: p.availableScopes,
    logoUrl: logoAssets[p.logo],
    logoLightUrl: p.logoLight ? logoAssets[p.logoLight] : undefined,
  }));
