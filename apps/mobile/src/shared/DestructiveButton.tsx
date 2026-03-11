import { ActivityIndicator, Pressable, Text } from "react-native";

interface DestructiveButtonProps {
  onPress: () => void;
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function DestructiveButton({
  onPress,
  label,
  loadingLabel,
  loading,
  disabled,
}: DestructiveButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className="self-start flex-row items-center gap-2 px-4 py-2.5 bg-red-600 rounded-lg disabled:opacity-50"
    >
      {loading ? <ActivityIndicator color="white" size="small" /> : null}
      <Text className="text-sm font-medium text-white">
        {loading ? (loadingLabel ?? label) : label}
      </Text>
    </Pressable>
  );
}
