import { useColorScheme as useNativeWindColorScheme, vars } from "nativewind";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { View } from "react-native";
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
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  // Sync NativeWind color scheme
  useEffect(() => {
    if (!loaded) return;
    if (mode === "system") {
      setColorScheme("system");
    } else {
      setColorScheme(mode);
    }
  }, [mode, loaded, setColorScheme]);

  // Use NativeWind's resolved colorScheme as the single source of truth
  const isDark = colorScheme === "dark";

  const themeStyle = useMemo(
    () => vars(isDark ? darkVars : lightVars),
    [isDark],
  );

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    storage.setItem(STORAGE_KEY, newMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      <View style={[{ flex: 1 }, themeStyle]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
