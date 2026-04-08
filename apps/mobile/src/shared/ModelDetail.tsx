import type React from "react";
import { ScrollView, Text, View } from "react-native";

export interface ModelDetail {
  id: string;
  name: string;
  mode: string;
  maxInputTokens?: number | null;
  inputCostPerToken?: number | null;
  outputCostPerToken?: number | null;
  supportedModalities?: string[] | null;
  supportedOutputModalities?: string[] | null;
  inputCostPerImage?: number | null;
  inputCostPerImageToken?: number | null;
  outputCostPerImage?: number | null;
  outputCostPerImageToken?: number | null;
}

/** Payload type stored in sheetStore for the model-detail sheet routes. */
export interface ModelDetailSheetPayload {
  model: ModelDetail;
  /** Optional render prop for additional actions below the cost rows. */
  actions?: (model: ModelDetail) => React.ReactNode;
}

function formatCost(costPerToken: number): string {
  const perMillion = costPerToken * 1_000_000;
  if (perMillion < 0.01) return `$${perMillion.toFixed(4)}/M`;
  if (perMillion < 1) return `$${perMillion.toFixed(3)}/M`;
  return `$${perMillion.toFixed(2)}/M`;
}

/** Pure layout for the body of a ModelDetail sheet route. */
export function ModelDetailContent({
  model,
  actions,
}: {
  model: ModelDetail;
  actions?: (model: ModelDetail) => React.ReactNode;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "ID", value: model.id },
    { label: "Mode", value: model.mode },
  ];

  if (model.maxInputTokens)
    rows.push({
      label: "Max Input Tokens",
      value: model.maxInputTokens.toLocaleString(),
    });
  if (model.inputCostPerToken != null)
    rows.push({
      label: "Input Cost",
      value: formatCost(model.inputCostPerToken),
    });
  if (model.outputCostPerToken != null)
    rows.push({
      label: "Output Cost",
      value: formatCost(model.outputCostPerToken),
    });
  if (model.supportedModalities?.length)
    rows.push({
      label: "Input Modalities",
      value: model.supportedModalities.join(", "),
    });
  if (model.supportedOutputModalities?.length)
    rows.push({
      label: "Output Modalities",
      value: model.supportedOutputModalities.join(", "),
    });
  if (model.inputCostPerImage != null)
    rows.push({
      label: "Input Cost / Image",
      value: `$${model.inputCostPerImage.toFixed(4)}`,
    });
  if (model.outputCostPerImage != null)
    rows.push({
      label: "Output Cost / Image",
      value: `$${model.outputCostPerImage.toFixed(4)}`,
    });

  return (
    <ScrollView contentContainerClassName="px-4 pb-6 gap-0">
      {rows.map((row, i) => (
        <View
          key={row.label}
          className={`flex-row items-center justify-between py-3 ${i > 0 ? "border-t border-app-border" : ""}`}
        >
          <Text className="text-sm text-text-muted">{row.label}</Text>
          <Text className="text-sm text-text-primary font-medium">
            {row.value}
          </Text>
        </View>
      ))}
      {actions ? <View className="pt-4">{actions(model)}</View> : null}
    </ScrollView>
  );
}
