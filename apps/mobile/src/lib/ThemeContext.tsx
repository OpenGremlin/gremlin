import { useColorScheme as useNativeWindColorScheme, vars } from "nativewind";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, View } from "react-native";
import { storage } from "./storage";
import { darkVars, lightVars } from "./themeVars";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "gremlin_theme_mode";

const ThemeContext = createContext<ThemeState>({
  mode: "system",
  isDark: true,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useNativeWindColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">(
    () => (Appearance.getColorScheme() ?? "dark") as "light" | "dark",
  );

  // Track system appearance changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme ?? "dark") as "light" | "dark");
    });
    return () => sub.remove();
  }, []);

  // Load saved preference
  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  // Derive isDark from our own state, not NativeWind's return value
  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";

  // Sync NativeWind color scheme (for dark: class support)
  // Always pass the resolved value so dark: classes stay in sync with CSS vars
  useEffect(() => {
    if (!loaded) return;
    setColorScheme(isDark ? "dark" : "light");
  }, [isDark, loaded, setColorScheme]);

  const themeStyle = useMemo(
    () => vars(isDark ? darkVars : lightVars),
    [isDark],
  );

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    storage.setItem(STORAGE_KEY, newMode);
  }, []);

  const themeValue = useMemo(
    () => ({ mode, isDark, setMode }),
    [mode, isDark, setMode],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <View style={[{ flex: 1 }, themeStyle]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
