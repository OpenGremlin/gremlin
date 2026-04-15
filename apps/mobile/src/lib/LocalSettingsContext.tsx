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
const DOC_DISCUSS_KEY = "gremlin_document_discuss";

interface LocalSettings {
  voiceEnabled: boolean;
  toggleVoice: () => void;
  documentReaderId: string | null;
  setDocumentReaderId: (id: string) => void;
  documentDiscussAgentId: string | null;
  setDocumentDiscussAgentId: (id: string) => void;
}

const LocalSettingsContext = createContext<LocalSettings>({
  voiceEnabled: false,
  toggleVoice: () => {},
  documentReaderId: null,
  setDocumentReaderId: () => {},
  documentDiscussAgentId: null,
  setDocumentDiscussAgentId: () => {},
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
  const [documentDiscussAgentId, setDocumentDiscussAgentIdState] = useState<
    string | null
  >(null);

  useEffect(() => {
    Promise.all([
      storage.getItem(VOICE_MODE_KEY),
      storage.getItem(DOC_READER_KEY),
      storage.getItem(DOC_DISCUSS_KEY),
    ]).then(([voice, readerId, discussId]) => {
      if (voice === "true") setVoiceEnabled(true);
      if (readerId) setDocumentReaderIdState(readerId);
      if (discussId) setDocumentDiscussAgentIdState(discussId);
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

  const setDocumentDiscussAgentId = useCallback((id: string) => {
    setDocumentDiscussAgentIdState(id);
    storage.setItem(DOC_DISCUSS_KEY, id);
  }, []);

  const value = useMemo(
    () => ({
      voiceEnabled,
      toggleVoice,
      documentReaderId,
      setDocumentReaderId,
      documentDiscussAgentId,
      setDocumentDiscussAgentId,
    }),
    [
      voiceEnabled,
      toggleVoice,
      documentReaderId,
      setDocumentReaderId,
      documentDiscussAgentId,
      setDocumentDiscussAgentId,
    ],
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
