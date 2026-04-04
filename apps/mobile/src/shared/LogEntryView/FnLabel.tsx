import { Text } from "react-native";

/**
 * Renders a function-call style label: **fn**(**arg**)
 * Bold function name and parens, normal-weight arg text.
 */
export function FnLabel({ fn, arg }: { fn: string; arg: string }) {
  return (
    <Text className="text-sm text-text-secondary font-mono" numberOfLines={1}>
      <Text className="font-bold">{fn}</Text>
      <Text className="font-bold">(</Text>
      {arg}
      <Text className="font-bold">)</Text>
    </Text>
  );
}
