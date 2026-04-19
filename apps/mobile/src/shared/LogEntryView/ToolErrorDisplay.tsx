import { Text, View } from "react-native";
import { ToolBlock } from "./ToolBlock";

export type ToolErrorShape = {
  code: string;
  message: string;
  hint?: string | null;
};

/**
 * Inline error text in the shape "{CODE}: {message} {hint?}". Used both by
 * the hint-based fallback (under the status line) and by `ToolErrorBlock`
 * (inside a tool card for tools that have no hint builder).
 *
 * Exported so every error render site uses identical formatting.
 */
export function ToolErrorText({ toolError }: { toolError: ToolErrorShape }) {
  return (
    <Text className="text-sm text-error italic px-1 pb-1">
      <Text className="font-semibold not-italic">{toolError.code}</Text>
      {`: ${toolError.message}`}
      {toolError.hint ? ` ${toolError.hint}` : ""}
    </Text>
  );
}

/**
 * Full error card for tools whose custom widget has no hint-based fallback
 * to delegate to — e.g. `runCommand` and `requestUserInput`, which are
 * short-circuited to null in `computeDisplayHint`. Renders a `ToolBlock`
 * with the tool's label and an inline error body.
 */
export function ToolErrorBlock({
  label,
  toolError,
  createdAt,
  showTimestamp,
}: {
  label: React.ReactNode;
  toolError: ToolErrorShape;
  createdAt: string;
  showTimestamp: boolean;
}) {
  return (
    <ToolBlock
      label={label}
      createdAt={createdAt}
      showTimestamp={showTimestamp}
    >
      <View className="px-3 py-2">
        <ToolErrorText toolError={toolError} />
      </View>
    </ToolBlock>
  );
}
