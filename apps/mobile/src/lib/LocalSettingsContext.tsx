import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { storage } from "./storage";

const VOICE_MODE_KEY = "gremlin_voice_mode";

interface LocalSettings {
  voiceEnabled: boolean;
  toggleVoice: () => void;
}

const LocalSettingsContext = createContext<LocalSettings>({
  voiceEnabled: false,
  toggleVoice: () => {},
});

export function LocalSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    storage.getItem(VOICE_MODE_KEY).then((voice) => {
      if (voice === "true") setVoiceEnabled(true);
    });
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      storage.setItem(VOICE_MODE_KEY, String(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ voiceEnabled, toggleVoice }),
    [voiceEnabled, toggleVoice],
  );

  return (
    <LocalSettingsContext.Provider value={value}>
      {children}
    </LocalSettingsContext.Provider>
  );
}

export function useLocalSettings() {
  return useContext(LocalSettingsContext);
}
