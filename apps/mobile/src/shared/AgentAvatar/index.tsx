import { useQuery } from "@apollo/client";
import { Crown } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { AgentQuery } from "../../graphql/queries";

// Gold used for the manager badge. Inline because there's no theme token
// for this concept yet — promote to `--color-manager` in themeVars.ts if
// manager visuals grow beyond this one badge.
const MANAGER_GOLD = "#F5C518";

export function AgentAvatar({
  id,
  size = 48,
  cornerClass = "rounded-full",
  cornerStyle,
  hideManagerBadge = false,
}: {
  id: string;
  size?: number;
  /**
   * Tailwind class controlling the avatar's corner radius. Defaults to a
   * full circle. Ignored when `cornerStyle` is provided.
   */
  cornerClass?: string;
  /**
   * Inline border-radius overrides for layouts that need pixel-precise
   * corners (e.g. a card avatar that must trace the inside of a 1px
   * border, where the visible inner radius is `outer - borderWidth`).
   * When set, `cornerClass` is dropped so the className `borderRadius`
   * doesn't fight with these explicit values.
   */
  cornerStyle?: StyleProp<ViewStyle>;
  /**
   * Suppress the manager crown badge even when the agent has manager mode
   * on with a non-empty team. Use in contexts where the agent is being
   * listed as a delegation candidate (e.g. a manager's team picker),
   * since a crown there is confusing.
   */
  hideManagerBadge?: boolean;
}) {
  const { data } = useQuery(AgentQuery, { variables: { id } });
  const agent = data?.agent;
  const name = agent?.name ?? "";
  const isRetired = agent?.retired ?? false;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imgError = agent?.imageUrl != null && agent.imageUrl === failedUrl;

  // Manager badge is only meaningful when the agent actually has a team.
  // Skip at small sizes where a legible icon wouldn't fit — all our
  // <48px call sites are identifier-only contexts anyway.
  const isManager = !!(
    agent?.config?.manager?.enabled &&
    (agent.config.manager.team?.length ?? 0) > 0
  );
  const showBadge = isManager && !hideManagerBadge && size >= 48;
  const badgeSize = Math.round(size * 0.28);
  // Hover the crown above the avatar edge, roughly half on / half off.
  // Scales with badge size so small and large avatars look consistent.
  const badgeTopOffset = -Math.round(badgeSize * 0.55);

  return (
    <View
      style={{ width: size, height: size }}
      className={`shrink-0 ${isRetired ? "opacity-50" : ""}`}
    >
      <View
        className={`w-full h-full bg-surface-alt items-center justify-center overflow-hidden ${cornerStyle ? "" : cornerClass}`}
        style={cornerStyle}
      >
        {agent?.imageUrl && !imgError ? (
          <Image
            source={{ uri: agent.imageUrl }}
            style={{ width: size, height: size }}
            onError={() => setFailedUrl(agent.imageUrl ?? null)}
          />
        ) : (
          <Text className="text-sm text-text-muted font-medium">{name[0]}</Text>
        )}
      </View>
      {showBadge && (
        <View
          className="absolute left-0 right-0 items-center"
          style={{ top: badgeTopOffset }}
        >
          <Crown
            size={badgeSize}
            color={MANAGER_GOLD}
            fill={MANAGER_GOLD}
            strokeWidth={2}
          />
        </View>
      )}
    </View>
  );
}
