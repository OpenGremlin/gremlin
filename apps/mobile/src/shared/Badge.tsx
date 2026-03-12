import { Text, View } from "react-native";

const variants: Record<string, string> = {
  installed: "bg-success-surface",
  available: "bg-accent-surface",
};

const textVariants: Record<string, string> = {
  installed: "text-success",
  available: "text-accent",
};

export function Badge({ label }: { label: string }) {
  const key = label.toLowerCase();
  const bgCls = variants[key] ?? "bg-surface-alt/15";
  const textCls = textVariants[key] ?? "text-text-muted";
  return (
    <View className={`rounded-full px-2 py-0.5 ${bgCls}`}>
      <Text className={`text-xs font-medium ${textCls}`}>{label}</Text>
    </View>
  );
}
