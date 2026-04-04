import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { storage } from "./storage";

const STORAGE_KEY = "gremlin_voice_mode";

interface VoiceModeState {
  voiceEnabled: boolean;
  toggleVoice: () => void;
}

const VoiceModeContext = createContext<VoiceModeState>({
  voiceEnabled: false,
  toggleVoice: () => {},
});

export function VoiceModeProvider({ children }: { children: React.ReactNode }) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((val) => {
      if (val === "true") setVoiceEnabled(true);
    });
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      storage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <VoiceModeContext.Provider value={{ voiceEnabled, toggleVoice }}>
      {children}
    </VoiceModeContext.Provider>
  );
}

export function useVoiceModeContext() {
  return useContext(VoiceModeContext);
}
