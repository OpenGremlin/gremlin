import { ActivityIndicator, Pressable, Text } from "react-native";

interface SaveButtonProps {
  onPress: () => void;
  disabled?: boolean;
  saving?: boolean;
  label?: string;
}

export function SaveButton({
  onPress,
  disabled,
  saving,
  label = "Save",
}: SaveButtonProps) {
  const isDisabled = disabled || saving;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`self-start px-4 py-2.5 rounded-lg ${
        isDisabled
          ? "bg-neutral-700/60"
          : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700"
      }`}
      style={isDisabled ? { cursor: "default" } : { cursor: "pointer" }}
    >
      {saving ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text
          className={`text-sm font-medium ${
            isDisabled ? "text-neutral-500" : "text-white"
          }`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
