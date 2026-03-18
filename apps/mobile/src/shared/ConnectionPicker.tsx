import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { IntegrationLogo } from "./IntegrationLogo";

interface ConnectionOption {
  id: string;
  providerId: string;
  isRevoked: boolean;
  meta: { accountId?: string | null };
}

interface ConnectionRequirement {
  provider: string;
  providerName: string;
  optional?: boolean | null;
  multi?: boolean | null;
  reason: string;
}

export function ConnectionPicker({
  requirements,
  connections,
  selected,
  onSelect,
  onDeselect,
}: {
  requirements: readonly ConnectionRequirement[];
  connections: readonly ConnectionOption[];
  selected: Record<string, string[]>;
  onSelect: (provider: string, connectionId: string) => void;
  onDeselect?: (provider: string, connectionId: string) => void;
}) {
  return (
    <View className="gap-3">
      {requirements.map((req) => {
        const available = connections.filter(
          (c) => c.providerId === req.provider && !c.isRevoked,
        );
        const selectedIds = selected[req.provider] ?? [];
        const isMulti = req.multi ?? false;
        return (
          <View key={req.provider} className="gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-text-primary">
                {req.providerName}
              </Text>
              {req.optional ? (
                <Text className="text-xs text-text-muted">(optional)</Text>
              ) : null}
              {isMulti ? (
                <Text className="text-xs text-text-muted">(multi)</Text>
              ) : null}
            </View>
            <Text className="text-xs text-text-muted">{req.reason}</Text>
            {available.length > 0 ? (
              <View className="gap-2">
                {available.map((conn) => {
                  const isSelected = selectedIds.includes(conn.id);
                  return (
                    <Pressable
                      key={conn.id}
                      onPress={() => {
                        if (isMulti && isSelected && onDeselect) {
                          onDeselect(req.provider, conn.id);
                        } else if (!isMulti && isSelected) {
                          // Single-select: clicking selected item is a no-op
                        } else {
                          onSelect(req.provider, conn.id);
                        }
                      }}
                      className={`flex-row items-center gap-3 rounded-lg border p-3 ${
                        isSelected
                          ? "border-emerald-500 bg-surface-alt/50"
                          : "border-app-border bg-surface-alt/30"
                      }`}
                    >
                      <IntegrationLogo id={req.provider} size={32} />
                      <View className="flex-1 min-w-0">
                        <Text
                          className="text-sm text-text-secondary"
                          numberOfLines={1}
                        >
                          {conn.meta.accountId &&
                          conn.meta.accountId !== "unknown"
                            ? conn.meta.accountId
                            : conn.id}
                        </Text>
                      </View>
                      {isMulti && isSelected ? (
                        <Check size={16} color="#059669" />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View className="gap-1">
                <Text className="text-xs text-text-muted">
                  No {req.providerName} connections.
                </Text>
                <Pressable
                  onPress={() =>
                    router.push(
                      `/settings/connections/provider/${req.provider}` as never,
                    )
                  }
                >
                  <Text className="text-xs text-accent">
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
