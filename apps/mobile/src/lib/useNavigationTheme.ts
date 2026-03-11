import { useTheme } from "./ThemeContext";

const lightColors = {
  background: "#f0f0f0",
  headerBackground: "#f0f0f0",
  headerText: "#171717",
  tabBarBackground: "#f0f0f0",
  tabBarBorder: "#d4d4d4",
  tabBarActive: "#4f46e5",
  tabBarInactive: "#a3a3a3",
  border: "#d4d4d4",
  loadingIndicator: "#a3a3a3",
  accentIndicator: "#4f46e5",
  placeholderText: "#a3a3a3",
  iconDefault: "#737373",
  iconMuted: "#a3a3a3",
};

const darkColors = {
  background: "#0a0a0a",
  headerBackground: "#0a0a0a",
  headerText: "#e5e5e5",
  tabBarBackground: "#0a0a0a",
  tabBarBorder: "#262626",
  tabBarActive: "#818cf8",
  tabBarInactive: "#737373",
  border: "#404040",
  loadingIndicator: "#737373",
  accentIndicator: "#818cf8",
  placeholderText: "#737373",
  iconDefault: "#a3a3a3",
  iconMuted: "#737373",
};

export function useNavigationTheme() {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
}
