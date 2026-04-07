import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useNavigationTheme } from "../lib/useNavigationTheme";

type InputProps = {
  size?: "sm" | "lg";
} & TextInputProps;

// Use text-[Npx] instead of text-sm/text-base to set fontSize without
// NativeWind also setting a lineHeight that clips descenders on iOS.
const SIZE_CLASSES = {
  sm: "rounded-lg px-3 py-2.5 text-[14px]",
  lg: "rounded-xl px-4 py-3.5 text-[16px]",
};

export const Input = forwardRef<TextInput, InputProps>(
  ({ size = "sm", className, ...rest }, ref) => {
    const colors = useNavigationTheme();
    return (
      <TextInput
        ref={ref}
        style={{ borderCurve: "continuous" }}
        className={`bg-input-bg border border-input-border text-text-primary ${SIZE_CLASSES[size]} ${className ?? ""}`}
        placeholderTextColor={colors.placeholderText}
        {...rest}
      />
    );
  },
);
