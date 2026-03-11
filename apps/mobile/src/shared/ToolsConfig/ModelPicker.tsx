import { Check } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import type { IntegrationProvidersQuery } from "../../graphql/generated/graphql";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { SheetModal } from "../SheetModal";

type Provider = IntegrationProvidersQuery["integrationProviders"][number];

interface ModelOption {
  key: string;
  label: string;
  section: string;
  value: { type: string; modelId?: string; connectionId?: string };
}

export function ModelPicker({
  model,
  providers,
  bedrockModels,
  onSelect,
  onClose,
}: {
  model?: {
    type: string;
    modelId?: string | null;
    connectionId?: string | null;
  } | null;
  providers: Provider[];
  bedrockModels: string[];
  onSelect: (value: {
    type: string;
    modelId?: string;
    connectionId?: string;
  }) => void;
  onClose: () => void;
}) {
  const colors = useNavigationTheme();
  const bedrockProvider = providers.find((p) => p.id === "bedrock");
  const bedrockEnabledModels = (bedrockProvider?.models ?? []).filter((m) =>
    bedrockModels.includes(m.id),
  );
  const apiProviders = providers.filter(
    (p) =>
      p.category === "ai" &&
      p.id !== "bedrock" &&
      p.hasConnection &&
      p.models?.length,
  );

  const options: ModelOption[] = [];
  for (const m of bedrockEnabledModels) {
    options.push({
      key: `bedrock:${m.id}`,
      label: m.name,
      section: "Bedrock",
      value: { type: "bedrock", modelId: m.id },
    });
  }
  for (const provider of apiProviders) {
    for (const m of provider.models ?? []) {
      options.push({
        key: `${provider.id}:${m.id}`,
        label: m.name,
        section: provider.service,
        value: { type: "connection", connectionId: `${provider.id}:${m.id}` },
      });
    }
  }

  function isSelected(opt: ModelOption): boolean {
    if (!model) return false;
    if (opt.value.type === "bedrock")
      return model.type === "bedrock" && model.modelId === opt.value.modelId;
    return (
      model.type === "connection" &&
      model.connectionId === opt.value.connectionId
    );
  }

  // Group by section for headers
  let lastSection = "";

  return (
    <SheetModal visible title="Choose Model" onClose={onClose}>
      {options.length === 0 ? (
        <View className="py-12 items-center">
          <Text className="text-sm text-text-muted">No models available</Text>
        </View>
      ) : (
        <FlatList
          data={options}
          keyExtractor={(item) => item.key}
          contentContainerClassName="pb-6"
          renderItem={({ item }) => {
            const showHeader = item.section !== lastSection;
            lastSection = item.section;
            const selected = isSelected(item);
            return (
              <>
                {showHeader && (
                  <Text className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {item.section}
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                  className="flex-row items-center justify-between px-4 py-3 active:bg-surface-alt"
                >
                  <Text
                    className={`text-sm ${selected ? "text-indigo-300" : "text-text-secondary"}`}
                  >
                    {item.label}
                  </Text>
                  {selected && (
                    <Check size={14} color={colors.accentIndicator} />
                  )}
                </Pressable>
              </>
            );
          }}
        />
      )}
    </SheetModal>
  );
}
