import { X } from "lucide-react-native";
import { Pressable, type TextInputProps, View } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";
import { Input } from "./Input";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
} & Omit<TextInputProps, "value" | "onChangeText" | "placeholder">;

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Search...",
  ...rest
}: SearchInputProps) {
  const colors = useNavigationTheme();
  return (
    <View className="flex-row items-center">
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1"
        {...rest}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          className="absolute right-2 p-1"
          hitSlop={8}
        >
          <X size={16} color={colors.iconMuted} />
        </Pressable>
      )}
    </View>
  );
}
