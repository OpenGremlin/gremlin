import { useQuery } from "@apollo/client";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { AgentQuery } from "../../graphql/queries";

export function AgentAvatar({ id, size = 48 }: { id: string; size?: number }) {
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
      <View className="w-full h-full rounded-full bg-surface-alt items-center justify-center overflow-hidden">
        {agent?.imageUrl && !imgError ? (
          <Image
            source={{ uri: agent.imageUrl }}
            style={{ width: size, height: size }}
            className="rounded-full"
            onError={() => setFailedUrl(agent.imageUrl ?? null)}
          />
        ) : (
          <Text className="text-sm text-text-muted font-medium">{name[0]}</Text>
        )}
      </View>
    </View>
  );
}
