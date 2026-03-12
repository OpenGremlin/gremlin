import { Pressable, View } from "react-native";

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Toggle({ enabled, onChange, disabled }: ToggleProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onChange}
      className={`relative h-6 w-11 rounded-full ${
        enabled ? "bg-accent" : "bg-app-border"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <View
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </Pressable>
  );
}
