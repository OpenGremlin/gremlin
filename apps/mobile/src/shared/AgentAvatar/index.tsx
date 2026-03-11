import { useState } from "react";
import { Image, Text, View } from "react-native";
import { AgentQuery } from "../../graphql/queries";
import { useQuery } from "../../hooks/useQuery";

export function AgentAvatar({ id, size = 48 }: { id: string; size?: number }) {
  const { data } = useQuery(AgentQuery, { id });
  const agent = data?.agent;
  const name = agent?.name ?? "";
  const isRetired = agent?.retired ?? false;
  const [imgError, setImgError] = useState(false);

  return (
    <View
      style={{ width: size, height: size }}
      className={`shrink-0 ${isRetired ? "opacity-50" : ""}`}
    >
      <View className="w-full h-full rounded-full bg-surface-alt items-center justify-center overflow-hidden">
        {agent?.imageUrl && !imgError ? (
          <Image
            source={{ uri: agent.imageUrl }}
            style={{ width: size, height: size }}
            className="rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <Text className="text-sm text-text-muted font-medium">{name[0]}</Text>
        )}
      </View>
    </View>
  );
}
