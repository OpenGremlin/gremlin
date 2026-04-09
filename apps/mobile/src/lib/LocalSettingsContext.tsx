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
const DOC_READER_KEY = "gremlin_document_reader";

interface LocalSettings {
  voiceEnabled: boolean;
  toggleVoice: () => void;
  documentReaderId: string | null;
  setDocumentReaderId: (id: string) => void;
}

const LocalSettingsContext = createContext<LocalSettings>({
  voiceEnabled: false,
  toggleVoice: () => {},
  documentReaderId: null,
  setDocumentReaderId: () => {},
});

export function LocalSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [documentReaderId, setDocumentReaderIdState] = useState<string | null>(
    null,
  );

  useEffect(() => {
    storage.getItem(VOICE_MODE_KEY).then((voice) => {
      if (voice === "true") setVoiceEnabled(true);
    });
    storage.getItem(DOC_READER_KEY).then((id) => {
      if (id) setDocumentReaderIdState(id);
    });
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      storage.setItem(VOICE_MODE_KEY, String(next));
      return next;
    });
  }, []);

  const setDocumentReaderId = useCallback((id: string) => {
    setDocumentReaderIdState(id);
    storage.setItem(DOC_READER_KEY, id);
  }, []);

  const value = useMemo(
    () => ({
      voiceEnabled,
      toggleVoice,
      documentReaderId,
      setDocumentReaderId,
    }),
    [voiceEnabled, toggleVoice, documentReaderId, setDocumentReaderId],
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
