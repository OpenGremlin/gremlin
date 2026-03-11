import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { IntegrationLogo } from "./IntegrationLogo";

interface ConnectionOption {
  id: string;
  description: string;
  providerId: string;
  isRevoked: boolean;
}

interface ConnectionRequirement {
  providerId: string;
  providerName: string;
  optional?: boolean | null;
  reason: string;
}

export function ConnectionPicker({
  requirements,
  connections,
  selected,
  onSelect,
}: {
  requirements: readonly ConnectionRequirement[];
  connections: readonly ConnectionOption[];
  selected: Record<string, string>;
  onSelect: (providerId: string, connectionId: string) => void;
}) {
  return (
    <View className="gap-3">
      {requirements.map((req) => {
        const available = connections.filter(
          (c) => c.providerId === req.providerId && !c.isRevoked,
        );
        const selectedId = selected[req.providerId];
        return (
          <View key={req.providerId} className="gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-text-primary">
                {req.providerName}
              </Text>
              {req.optional ? (
                <Text className="text-xs text-text-muted">(optional)</Text>
              ) : null}
            </View>
            <Text className="text-xs text-text-muted">{req.reason}</Text>
            {available.length > 0 ? (
              <View className="gap-2">
                {available.map((conn) => (
                  <Pressable
                    key={conn.id}
                    onPress={() => onSelect(req.providerId, conn.id)}
                    className={`flex-row items-center gap-3 rounded-lg border p-3 ${
                      selectedId === conn.id
                        ? "border-emerald-500 bg-surface-alt/50"
                        : "border-app-border bg-surface-alt/30"
                    }`}
                  >
                    <IntegrationLogo id={req.providerId} size={32} />
                    <Text className="text-sm text-text-secondary">
                      {conn.description || conn.id}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className="gap-1">
                <Text className="text-xs text-text-muted">
                  No {req.providerName} connections.
                </Text>
                <Pressable
                  onPress={() =>
                    router.push(
                      `/settings/integrations/${req.providerId}` as never,
                    )
                  }
                >
                  <Text className="text-xs text-indigo-400">
                    Set up a connection
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
