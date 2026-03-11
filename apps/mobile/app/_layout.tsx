import "../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/lib/AuthContext";
import { ThemeProvider, useTheme } from "../src/lib/ThemeContext";

function StatusBarThemed() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBarThemed />
        <Slot />
      </AuthProvider>
    </ThemeProvider>
  );
}
