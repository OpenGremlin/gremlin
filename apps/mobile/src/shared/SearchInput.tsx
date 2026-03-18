import { TextInput, type TextInputProps } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

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
    <TextInput
      className="bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm text-text-primary"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.placeholderText}
      autoCapitalize="none"
      autoCorrect={false}
      {...rest}
    />
  );
}
