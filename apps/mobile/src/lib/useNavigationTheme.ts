import { useTheme } from "./ThemeContext";

const lightColors = {
  background: "#f0f0f0",
  headerBackground: "#f0f0f0",
  headerText: "#171717",
  tabBarBackground: "#f0f0f0",
  tabBarBorder: "#d4d4d4",
  tabBarActive: "#4f46e5",
  tabBarInactive: "#525252",
  border: "#d4d4d4",
  loadingIndicator: "#a3a3a3",
  accentIndicator: "#4f46e5",
  accent: "#4f46e5",
  accentLight: "#6366f1",
  placeholderText: "#a3a3a3",
  iconDefault: "#737373",
  iconMuted: "#a3a3a3",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  userBubble: "#4f46e5",
};

const darkColors = {
  background: "#141414",
  headerBackground: "#141414",
  headerText: "#e5e5e5",
  tabBarBackground: "#141414",
  tabBarBorder: "#2a2a2a",
  tabBarActive: "#a5b4fc",
  tabBarInactive: "#a3a3a3",
  border: "#404040",
  loadingIndicator: "#737373",
  accentIndicator: "#818cf8",
  accent: "#818cf8",
  accentLight: "#a5b4fc",
  placeholderText: "#737373",
  iconDefault: "#a3a3a3",
  iconMuted: "#737373",
  success: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
  userBubble: "#4338ca",
};

export function useNavigationTheme() {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
}
