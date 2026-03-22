import { forwardRef } from "react";
import { Platform, TextInput, type TextInputProps } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

type InputProps = {
  size?: "sm" | "lg";
} & TextInputProps;

const SIZE_CLASSES = {
  sm: "rounded-lg px-3 py-2.5 text-sm leading-[18px]",
  lg: "rounded-xl px-4 py-3.5 text-base leading-[20px]",
};

// Fixed heights prevent iOS secure text bullets from changing input height
const SECURE_HEIGHT = Platform.OS === "ios" ? { sm: 42, lg: 52 } : null;

export const Input = forwardRef<TextInput, InputProps>(
  ({ size = "sm", className, style, secureTextEntry, ...rest }, ref) => {
    const colors = useNavigationTheme();
    const secureStyle =
      secureTextEntry && SECURE_HEIGHT
        ? { height: SECURE_HEIGHT[size] }
        : undefined;
    return (
      <TextInput
        ref={ref}
        className={`bg-input-bg border border-input-border text-text-primary ${SIZE_CLASSES[size]} ${className ?? ""}`}
        placeholderTextColor={colors.placeholderText}
        secureTextEntry={secureTextEntry}
        style={secureStyle ? [secureStyle, style] : style}
        {...rest}
      />
    );
  },
);
