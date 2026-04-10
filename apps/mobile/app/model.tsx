import { useQuery } from "@apollo/client";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  EnabledModelDetailsQuery,
  IntegrationProvidersQuery,
  SetDefaultImageModelMutation,
  SetDefaultModelMutation,
  SetDefaultSpeechModelMutation,
} from "../src/graphql/queries";
import { execute } from "../src/lib/apolloClient";
import { Button } from "../src/shared/Button";
import { ModelDetailContent } from "../src/shared/ModelDetail";
import { Sheet } from "../src/shared/Sheet";

export default function ModelDetailScreen() {
  const { provider, model: modelId } = useLocalSearchParams<{
    provider: string;
    model: string;
  }>();
  const { data, loading } = useQuery(EnabledModelDetailsQuery, {
    variables: { providerId: provider ?? "" },
    skip: !provider,
  });
  const { data: providersData, refetch: refetchProviders } = useQuery(
    IntegrationProvidersQuery,
  );
  const [defaultError, setDefaultError] = useState<string | null>(null);

  const model = useMemo(
    () => data?.enabledModelDetails?.find((m) => m.id === modelId) ?? null,
    [data, modelId],
  );

  const isDefault = useMemo(() => {
    if (!providersData || !modelId) return true;
    const dm = providersData.defaultModel;
    const dim = providersData.defaultImageModel;
    const dsm = providersData.defaultSpeechModel;
    return (
      (dm?.providerId === provider && dm?.modelId === modelId) ||
      (dim?.providerId === provider && dim?.modelId === modelId) ||
      (dsm?.providerId === provider && dsm?.modelId === modelId)
    );
  }, [providersData, provider, modelId]);

  async function handleSetDefault() {
    if (!model || !provider || !modelId) return;
    setDefaultError(null);
    try {
      const vars = { providerId: provider, modelId };
      if (model.mode === "image_generation") {
        await execute(SetDefaultImageModelMutation, vars);
      } else if (model.mode === "audio_speech") {
        await execute(SetDefaultSpeechModelMutation, vars);
      } else {
        await execute(SetDefaultModelMutation, vars);
      }
      await refetchProviders();
      router.back();
    } catch (err) {
      setDefaultError(
        err instanceof Error ? err.message : "Failed to set default",
      );
    }
  }

  return (
    <Sheet title={model?.name ?? "Model"}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : model ? (
        <ModelDetailContent
          model={model}
          actions={
            isDefault
              ? undefined
              : () => (
                  <View className="gap-2">
                    {defaultError && (
                      <Text className="text-sm text-red-400 text-center">
                        {defaultError}
                      </Text>
                    )}
                    <Button onPress={handleSetDefault} fullWidth>
                      {model.mode === "image_generation"
                        ? "Set as Default Image"
                        : model.mode === "audio_speech"
                          ? "Set as Default Speech"
                          : "Set as Default LLM"}
                    </Button>
                  </View>
                )
          }
        />
      ) : null}
    </Sheet>
  );
}
