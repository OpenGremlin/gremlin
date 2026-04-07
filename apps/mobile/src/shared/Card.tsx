import type { ReactNode } from "react";
import { View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View
      style={{ borderCurve: "continuous" }}
      className={`bg-surface border border-app-border rounded-xl ${className ?? ""}`}
    >
      {children}
    </View>
  );
}
