import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeState>({
  mode: "system",
  isDark: true,
  setMode: () => {},
});

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return mode === "dark";
}

function applyThemeClass(isDark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("light", !isDark);
  root.classList.toggle("dark", isDark);
  document.body.style.background = isDark ? "#0a0a0a" : "#ffffff";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("gremlin-theme") as ThemeMode) || "system";
  });
  const [isDark, setIsDark] = useState(() => resolveIsDark(mode));

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem("gremlin-theme", m);
  }, []);

  // Apply theme whenever mode changes
  useEffect(() => {
    const dark = resolveIsDark(mode);
    setIsDark(dark);
    applyThemeClass(dark);
  }, [mode]);

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      applyThemeClass(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
