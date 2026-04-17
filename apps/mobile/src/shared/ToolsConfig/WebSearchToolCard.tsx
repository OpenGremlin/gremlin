import { Globe } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { Card } from "../Card";
import { Toggle } from "../Toggle";
import type { PlainConfig } from "./helpers";

interface WebSearchToolCardProps {
  config: PlainConfig;
  updateConfig: (patch: Partial<PlainConfig>) => void;
  webSearchProviders: Array<{ id: string; service: string }>;
}

export function WebSearchToolCard({
  config,
  updateConfig,
  webSearchProviders,
}: WebSearchToolCardProps) {
  const colors = useNavigationTheme();
  const hasWebSearch = webSearchProviders.length > 0;

  return (
    <Card className="overflow-hidden">
      <View className="flex-row px-4 py-3 gap-3">
        <View className="w-[22px] pt-0.5">
          <Globe size={22} color={colors.iconDefault} />
        </View>
        <View className="flex-1 gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-text-secondary">
                Web Search
              </Text>
              <Text className="text-xs text-text-muted">
                {hasWebSearch
                  ? "Search the web for information"
                  : "Connect Brave Search or Tavily to enable"}
              </Text>
            </View>
            <Toggle
              enabled={config.webSearch?.enabled ?? false}
              disabled={!hasWebSearch}
              onChange={() => {
                if (!hasWebSearch) return;
                const wasEnabled = config.webSearch?.enabled ?? false;
                updateConfig({
                  webSearch: {
                    enabled: !wasEnabled,
                    provider:
                      config.webSearch?.provider ??
                      webSearchProviders[0]?.id ??
                      "brave",
                  },
                });
              }}
            />
          </View>
          {config.webSearch?.enabled && hasWebSearch && (
            <View className="gap-1.5">
              {webSearchProviders.map((p) => {
                const selected =
                  (config.webSearch?.provider ?? webSearchProviders[0]?.id) ===
                  p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() =>
                      updateConfig({
                        webSearch: { enabled: true, provider: p.id },
                      })
                    }
                    className={`px-3 py-2.5 rounded-lg ${
                      selected ? "bg-accent-surface" : "bg-surface-alt"
                    }`}
                  >
                    <Text
                      className={`text-sm ${selected ? "text-text-primary" : "text-text-muted"}`}
                    >
                      {p.service}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {config.webSearch?.enabled && !hasWebSearch && (
            <Text className="text-xs text-warning">
              No search provider connected. Add a Brave Search or Tavily API key
              in Connections.
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}
