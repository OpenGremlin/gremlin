import { Check, X } from "lucide-react-native";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import type { IntegrationProvidersQuery } from "../../graphql/generated/graphql";

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
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="bg-neutral-900 rounded-t-2xl max-h-[70%]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
            <Text className="text-sm font-semibold text-neutral-100">
              Choose Model
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#a3a3a3" />
            </Pressable>
          </View>

          {options.length === 0 ? (
            <View className="py-12 items-center">
              <Text className="text-sm text-neutral-500">
                No models available
              </Text>
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
                      <Text className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        {item.section}
                      </Text>
                    )}
                    <Pressable
                      onPress={() => {
                        onSelect(item.value);
                        onClose();
                      }}
                      className="flex-row items-center justify-between px-4 py-3 active:bg-neutral-800"
                    >
                      <Text
                        className={`text-sm ${selected ? "text-indigo-300" : "text-neutral-300"}`}
                      >
                        {item.label}
                      </Text>
                      {selected && <Check size={14} color="#818cf8" />}
                    </Pressable>
                  </>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
