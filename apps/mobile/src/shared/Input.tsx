import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

type InputProps = {
  size?: "sm" | "lg";
} & TextInputProps;

const SIZE_CLASSES = {
  sm: "rounded-lg px-3 py-2.5 text-sm leading-[18px]",
  lg: "rounded-xl px-4 py-3.5 text-base leading-[20px]",
};

export const Input = forwardRef<TextInput, InputProps>(
  ({ size = "sm", className, ...rest }, ref) => {
    const colors = useNavigationTheme();
    return (
      <TextInput
        ref={ref}
        className={`bg-input-bg border border-input-border text-text-primary ${SIZE_CLASSES[size]} ${className ?? ""}`}
        placeholderTextColor={colors.placeholderText}
        {...rest}
      />
    );
  },
);
