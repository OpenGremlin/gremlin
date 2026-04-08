import { useQuery } from "@apollo/client";
import { useState } from "react";
import {
  Image,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { AgentQuery } from "../../graphql/queries";

export function AgentAvatar({
  id,
  size = 48,
  cornerClass = "rounded-full",
  cornerStyle,
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
}) {
  const { data } = useQuery(AgentQuery, { variables: { id } });
  const agent = data?.agent;
  const name = agent?.name ?? "";
  const isRetired = agent?.retired ?? false;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imgError = agent?.imageUrl != null && agent.imageUrl === failedUrl;

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
    </View>
  );
}
