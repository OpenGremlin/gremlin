import { Text, View } from "react-native";

export function Chip({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <View
      className={`rounded-full bg-accent-surface px-2 py-0.5 ${className ?? ""}`}
    >
      <Text className="text-[12px] font-semibold text-accent">{label}</Text>
    </View>
  );
}
