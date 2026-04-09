import { useApolloClient, useQuery } from "@apollo/client";
import { useCallback, useMemo, useState } from "react";
import type { AgentSummaryFragment } from "../graphql/generated/graphql";
import { AgentsQuery, DocumentSpeechUrlsQuery } from "../graphql/queries";
import { useLocalSettings } from "../lib/LocalSettingsContext";
import { clientLogger } from "../lib/logger";
import { useVoice } from "../lib/VoiceContext";
import { presentPicker } from "../shared/PickerModal";

/**
 * Hook for reading documents aloud via TTS.
 *
 * Resolves the reader agent from local settings (or first voice-enabled
 * agent), provides play/stop controls, and a picker to change the reader.
 */
export function useDocumentReader() {
  const { data } = useQuery(AgentsQuery);
  const { documentReaderId, setDocumentReaderId } = useLocalSettings();
  const client = useApolloClient();
  const { playUrls, unsubscribe } = useVoice();
  const [loading, setLoading] = useState(false);

  const voiceAgents = useMemo(
    () =>
      (data?.agents ?? []).filter(
        (a): a is AgentSummaryFragment & { voiceEnabled: true } =>
          a.voiceEnabled && !a.retired,
      ),
    [data?.agents],
  );

  // Resolve the active reader: persisted choice (if still valid), or first available
  const reader = useMemo(() => {
    if (voiceAgents.length === 0) return null;
    if (documentReaderId) {
      const match = voiceAgents.find((a) => a.id === documentReaderId);
      if (match) return match;
    }
    return voiceAgents[0];
  }, [voiceAgents, documentReaderId]);

  const play = useCallback(
    async (markdown: string) => {
      if (!reader) return;

      // Stop any active playback first
      unsubscribe();
      setLoading(true);

      try {
        const { data: result } = await client.query({
          query: DocumentSpeechUrlsQuery,
          variables: { text: markdown, agentId: reader.id },
          fetchPolicy: "network-only",
        });

        const urls = result?.documentSpeechUrls;
        if (!urls?.length) return;

        playUrls(urls);
      } catch (_err) {
        clientLogger.warn("Failed to play document speech", {
          agentId: reader.id,
        });
      } finally {
        setLoading(false);
      }
    },
    [reader, client, playUrls, unsubscribe],
  );

  const pickReader = useCallback(() => {
    if (voiceAgents.length === 0) return;

    presentPicker({
      title: "Choose Reader",
      options: voiceAgents.map((a) => ({
        value: a.id,
        label: a.name,
        subtitle: a.role ?? undefined,
      })),
      selected: reader?.id,
      onSelect: setDocumentReaderId,
    });
  }, [voiceAgents, reader?.id, setDocumentReaderId]);

  return {
    /** The resolved reader agent, or null if no agents support voice. */
    reader,
    /** Whether any agents support voice reading. */
    available: voiceAgents.length > 0,
    /** Whether TTS URLs are being fetched. */
    loading,
    /** Play the given markdown text as speech. */
    play,
    /** Open an agent picker to change the reader. */
    pickReader,
  };
}
