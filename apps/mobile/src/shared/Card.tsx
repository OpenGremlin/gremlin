import type { ReactNode } from "react";
import { View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
  borderless?: boolean;
}

export function Card({ children, className, borderless }: CardProps) {
  return (
    <View
      style={{ borderCurve: "continuous" }}
      className={`bg-surface rounded-xl ${borderless ? "" : "border border-app-border"} ${className ?? ""}`}
    >
      {children}
    </View>
  );
}
