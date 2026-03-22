import type { TextInputProps } from "react-native";
import { Input } from "./Input";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
} & Omit<TextInputProps, "value" | "onChangeText" | "placeholder">;

export function SearchInput({
  placeholder = "Search...",
  ...rest
}: SearchInputProps) {
  return (
    <Input
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      {...rest}
    />
  );
}
