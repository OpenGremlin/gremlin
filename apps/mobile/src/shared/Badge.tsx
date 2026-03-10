import { Text, View } from "react-native";

const variants: Record<string, string> = {
  installed: "bg-green-500/15",
  available: "bg-indigo-500/15",
};

const textVariants: Record<string, string> = {
  installed: "text-green-400",
  available: "text-indigo-400",
};

export function Badge({ label }: { label: string }) {
  const key = label.toLowerCase();
  const bgCls = variants[key] ?? "bg-neutral-500/15";
  const textCls = textVariants[key] ?? "text-neutral-400";
  return (
    <View className={`rounded-full px-2 py-0.5 ${bgCls}`}>
      <Text className={`text-xs font-medium ${textCls}`}>{label}</Text>
    </View>
  );
}
