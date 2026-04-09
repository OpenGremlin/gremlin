import { useApolloClient, useQuery } from "@apollo/client";
import * as Clipboard from "expo-clipboard";
import { useCallback } from "react";
import { ActionSheetIOS, Platform } from "react-native";
import { AgentQuery, SpeechUrlsQuery } from "../graphql/queries";
import { haptics } from "../lib/haptics";
import { clientLogger } from "../lib/logger";
import { useVoice } from "../lib/VoiceContext";

/**
 * Long-press menu for agent bubbles. Offers "Copy" always, and
 * "Play as Speech" when the agent has TTS enabled.
 * Call once per chat screen, not per message.
 */
export function useBubbleLongPress(agentId: string) {
  const { data } = useQuery(AgentQuery, { variables: { id: agentId } });
  const speechAvailable = !!data?.agent?.config?.speech?.enabled;

  const client = useApolloClient();
  const { playUrls } = useVoice();

  const playMessage = useCallback(
    async (logId: string) => {
      try {
        const { data: result } = await client.query({
          query: SpeechUrlsQuery,
          variables: { logId },
          fetchPolicy: "network-only",
        });

        const urls = result?.speechUrls;
        if (!urls?.length) return;

        playUrls(urls);
      } catch (_err) {
        clientLogger.warn("Failed to play speech for log", { logId });
      }
    },
    [client, playUrls],
  );

  const handleLongPress = useCallback(
    (logId: string, content: string) => {
      haptics.medium();

      if (Platform.OS === "ios") {
        const options = speechAvailable
          ? ["Copy", "Play as Speech", "Cancel"]
          : ["Copy", "Cancel"];
        const cancelIndex = options.length - 1;

        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: cancelIndex },
          (index) => {
            if (index === 0) Clipboard.setStringAsync(content);
            if (speechAvailable && index === 1) playMessage(logId);
          },
        );
      } else {
        Clipboard.setStringAsync(content);
      }
    },
    [speechAvailable, playMessage],
  );

  return { handleLongPress };
}
