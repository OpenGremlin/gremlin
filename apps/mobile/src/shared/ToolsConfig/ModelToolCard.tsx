import { Cpu, Info, Volume2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { Card } from "../Card";
import { Toggle } from "../Toggle";
import type { PlainConfig } from "./helpers";
import { resolveModelIds } from "./helpers";

interface ModelSelectorProps {
  label: string;
  modelLabel: string;
  defaultLabel: string | null;
  usingDefault: boolean;
  onPickModel: () => void;
  onPresentDetail?: () => void;
  noDefaultWarning?: boolean;
}

function ModelSelector({
  label,
  modelLabel,
  defaultLabel,
  usingDefault,
  onPickModel,
  onPresentDetail,
  noDefaultWarning,
}: ModelSelectorProps) {
  const colors = useNavigationTheme();
  return (
    <>
      <Text className="text-sm text-text-secondary">{label}</Text>
      {noDefaultWarning && usingDefault && (
        <View className="gap-1">
          <Text className="text-xs text-error">
            No default model configured.
          </Text>
        </View>
      )}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onPickModel}
          className={`flex-1 px-3 py-2.5 rounded-lg border ${!usingDefault ? "bg-accent-surface border-accent-border" : "bg-surface-alt border-app-border"}`}
        >
          <Text
            className={`text-sm ${!usingDefault ? "text-text-primary" : "text-text-secondary"}`}
          >
            {usingDefault
              ? defaultLabel
                ? `Use default (${defaultLabel})`
                : "Use default"
              : modelLabel}
          </Text>
        </Pressable>
        {!usingDefault && onPresentDetail && (
          <Pressable onPress={onPresentDetail} className="p-2">
            <Info size={18} color={colors.iconDefault} />
          </Pressable>
        )}
      </View>
    </>
  );
}

interface ModelToolCardProps {
  config: PlainConfig;
  updateConfig: (patch: Partial<PlainConfig>) => void;
  chatModelLabel: string;
  imageModelLabel: string;
  speechModelLabel: string;
  defaultChatModelLabel: string | null;
  defaultImageModelLabel: string | null;
  defaultSpeechModelLabel: string | null;
  hasDefaultModel: boolean;
  hasDefaultImageModel: boolean;
  hasDefaultSpeechModel: boolean;
  supportsReasoning: boolean;
  supportsImages: boolean;
  onPickModel: (mode: "chat" | "image_generation" | "audio_speech") => void;
  onPickVoice: () => void;
  onPresentModelDetail: (providerId: string, modelId: string) => void;
}

export function ModelToolCard({
  config,
  updateConfig,
  chatModelLabel,
  imageModelLabel,
  speechModelLabel,
  defaultChatModelLabel,
  defaultImageModelLabel,
  defaultSpeechModelLabel,
  hasDefaultModel,
  hasDefaultImageModel,
  hasDefaultSpeechModel,
  supportsReasoning,
  supportsImages,
  onPickModel,
  onPickVoice,
  onPresentModelDetail,
}: ModelToolCardProps) {
  const colors = useNavigationTheme();
  const usingDefaultChat = !config.model;
  const usingDefaultImage = !config.imageModel;
  const usingDefaultSpeech = !config.speechModel;
  const generateImagesEnabled = config.imageGeneration?.enabled ?? false;
  const speechEnabled = config.speech?.enabled ?? false;

  return (
    <Card className="overflow-hidden">
      <View className="flex-row px-4 py-3 gap-3">
        <View className="w-[22px] pt-0.5">
          <Cpu size={22} color={colors.iconDefault} />
        </View>
        <View className="flex-1 gap-2">
          <Text className="text-base font-bold text-text-secondary">
            Models
          </Text>

          <ModelSelector
            label="Chat Model"

            modelLabel={chatModelLabel}
            defaultLabel={defaultChatModelLabel}
            usingDefault={usingDefaultChat}
            noDefaultWarning={!hasDefaultModel}
            onPickModel={() => onPickModel("chat")}
            onPresentDetail={() => {
              const ids = resolveModelIds(config.model);
              if (ids) onPresentModelDetail(ids.providerId, ids.modelId);
            }}
          />

          {/* Reasoning */}
          <View className="flex-row items-center justify-between mt-1 gap-3">
            <View className="flex-1">
              <Text className="text-sm text-text-secondary">Reasoning</Text>
              <Text className="text-xs text-text-muted">
                {!supportsReasoning
                  ? "Selected model does not support reasoning"
                  : "Extended thinking for complex tasks"}
              </Text>
            </View>
            <Toggle
              enabled={supportsReasoning && (config.reasoning?.enabled ?? false)}
              disabled={!supportsReasoning}
              onChange={() => {
                const wasEnabled = config.reasoning?.enabled ?? false;
                updateConfig({ reasoning: { enabled: !wasEnabled } });
              }}
            />
          </View>

          {/* View Images */}
          <View className="flex-row items-center justify-between mt-1 gap-3">
            <View className="flex-1">
              <Text className="text-sm text-text-secondary">View Images</Text>
              <Text className="text-xs text-text-muted">
                {!supportsImages
                  ? "Selected model does not support images"
                  : "See image files in conversations"}
              </Text>
            </View>
            <Toggle
              enabled={supportsImages && (config.viewImage?.enabled ?? false)}
              disabled={!supportsImages}
              onChange={() => {
                const wasEnabled = config.viewImage?.enabled ?? false;
                updateConfig({ viewImage: { enabled: !wasEnabled } });
              }}
            />
          </View>

          {/* Image Generation */}
          <View className="flex-row items-center justify-between mt-1 gap-3">
            <View className="flex-1">
              <Text className="text-sm text-text-secondary">
                Image Generation
              </Text>
              <Text className="text-xs text-text-muted">
                Create images in responses
              </Text>
            </View>
            <Toggle
              enabled={generateImagesEnabled}
              onChange={() => {
                updateConfig({
                  imageGeneration: { enabled: !generateImagesEnabled },
                });
              }}
            />
          </View>
          {generateImagesEnabled && (
            <ModelSelector
              label="Image Model"

              modelLabel={imageModelLabel}
              defaultLabel={defaultImageModelLabel}
              usingDefault={usingDefaultImage}
              noDefaultWarning={!hasDefaultImageModel}
              onPickModel={() => onPickModel("image_generation")}
              onPresentDetail={() => {
                const ids = resolveModelIds(config.imageModel);
                if (ids) onPresentModelDetail(ids.providerId, ids.modelId);
              }}
            />
          )}

          {/* Speech */}
          <View className="flex-row items-center justify-between mt-1 gap-3">
            <View className="flex-1">
              <Text className="text-sm text-text-secondary">Speech</Text>
              <Text className="text-xs text-text-muted">
                Speak responses aloud and generate audio files
              </Text>
            </View>
            <Toggle
              enabled={speechEnabled}
              onChange={() => {
                updateConfig({ speech: { enabled: !speechEnabled } });
              }}
            />
          </View>
          {speechEnabled && (
            <>
              <ModelSelector
                label="Speech Model"

                modelLabel={speechModelLabel}
                defaultLabel={defaultSpeechModelLabel}
                usingDefault={usingDefaultSpeech}
                noDefaultWarning={!hasDefaultSpeechModel}
                onPickModel={() => onPickModel("audio_speech")}
                onPresentDetail={() => {
                  const ids = resolveModelIds(config.speechModel);
                  if (ids) onPresentModelDetail(ids.providerId, ids.modelId);
                }}
              />

              {/* Voice */}
              <Pressable
                onPress={onPickVoice}
                className={`flex-row items-center gap-2 px-3 py-2.5 rounded-lg border ${config.speech?.voice ? "bg-surface-alt border-app-border" : "bg-surface-alt border-warning"}`}
              >
                <Volume2
                  size={14}
                  color={
                    config.speech?.voice ? colors.iconDefault : colors.warning
                  }
                />
                <Text
                  className={`text-sm flex-1 ${config.speech?.voice ? "text-text-secondary" : "text-warning"}`}
                >
                  {config.speech?.voice ?? "Select a voice"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Card>
  );
}
