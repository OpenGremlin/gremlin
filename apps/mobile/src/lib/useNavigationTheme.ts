import { useTheme } from "./ThemeContext";

const lightColors = {
  background: "#f5f2ed",
  headerBackground: "#f5f2ed",
  headerText: "#171717",
  tabBarBackground: "#f5f2ed",
  tabBarBorder: "#ddd8d0",
  tabBarActive: "#4f46e5",
  tabBarInactive: "#4a4540",
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
  background: "#110c18",
  headerBackground: "#110c18",
  headerText: "#e5e5e5",
  tabBarBackground: "#110c18",
  tabBarBorder: "#271e34",
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
