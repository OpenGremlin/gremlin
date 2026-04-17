import { useApolloClient } from "@apollo/client";
import { useCallback, useState } from "react";
import type { AgentSummaryFragment } from "../graphql/generated/graphql";
import { DocumentSpeechUrlsQuery } from "../graphql/queries";
import { clientLogger } from "../lib/logger";
import { useVoice } from "../lib/VoiceContext";

/**
 * Hook for reading documents aloud via TTS using the given reader agent.
 *
 * Returns play controls; caller is responsible for resolving which agent
 * should read and whether the agent supports voice.
 */
export function useDocumentReader(reader: AgentSummaryFragment | null) {
  const client = useApolloClient();
  const { playUrls, unsubscribe } = useVoice();
  const [loading, setLoading] = useState(false);

  const play = useCallback(
    async (markdown: string) => {
      if (!reader) return;

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

  return { play, loading };
}
