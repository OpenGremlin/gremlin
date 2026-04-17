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
const DOC_AGENT_KEY = "gremlin_document_agent";
const DOC_ACTIONS_COLLAPSED_KEY = "gremlin_document_actions_collapsed";

interface LocalSettings {
  voiceEnabled: boolean;
  toggleVoice: () => void;
  documentAgentId: string | null;
  setDocumentAgentId: (id: string) => void;
  documentActionsCollapsed: boolean;
  setDocumentActionsCollapsed: (collapsed: boolean) => void;
}

const LocalSettingsContext = createContext<LocalSettings>({
  voiceEnabled: false,
  toggleVoice: () => {},
  documentAgentId: null,
  setDocumentAgentId: () => {},
  documentActionsCollapsed: false,
  setDocumentActionsCollapsed: () => {},
});

export function LocalSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [documentAgentId, setDocumentAgentIdState] = useState<string | null>(
    null,
  );
  const [documentActionsCollapsed, setDocumentActionsCollapsedState] =
    useState(false);

  useEffect(() => {
    Promise.all([
      storage.getItem(VOICE_MODE_KEY),
      storage.getItem(DOC_AGENT_KEY),
      storage.getItem(DOC_ACTIONS_COLLAPSED_KEY),
    ]).then(([voice, agentId, collapsed]) => {
      if (voice === "true") setVoiceEnabled(true);
      if (agentId) setDocumentAgentIdState(agentId);
      if (collapsed === "true") setDocumentActionsCollapsedState(true);
    });
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      storage.setItem(VOICE_MODE_KEY, String(next));
      return next;
    });
  }, []);

  const setDocumentAgentId = useCallback((id: string) => {
    setDocumentAgentIdState(id);
    storage.setItem(DOC_AGENT_KEY, id);
  }, []);

  const setDocumentActionsCollapsed = useCallback((collapsed: boolean) => {
    setDocumentActionsCollapsedState(collapsed);
    storage.setItem(DOC_ACTIONS_COLLAPSED_KEY, String(collapsed));
  }, []);

  const value = useMemo(
    () => ({
      voiceEnabled,
      toggleVoice,
      documentAgentId,
      setDocumentAgentId,
      documentActionsCollapsed,
      setDocumentActionsCollapsed,
    }),
    [
      voiceEnabled,
      toggleVoice,
      documentAgentId,
      setDocumentAgentId,
      documentActionsCollapsed,
      setDocumentActionsCollapsed,
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
