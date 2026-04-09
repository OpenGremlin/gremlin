import { useApolloClient, useQuery } from "@apollo/client";
import { useAudioPlayer } from "expo-audio";
import * as Clipboard from "expo-clipboard";
import { useCallback, useRef } from "react";
import { ActionSheetIOS, Platform } from "react-native";
import { AgentQuery, SpeechUrlQuery } from "../graphql/queries";
import { useAuth } from "../lib/AuthContext";
import { haptics } from "../lib/haptics";
import { clientLogger } from "../lib/logger";

/**
 * Long-press menu for agent bubbles. Offers "Copy" always, and
 * "Play as Speech" when the agent has TTS enabled.
 * Call once per chat screen, not per message.
 */
export function useBubbleLongPress(agentId: string) {
  const { data } = useQuery(AgentQuery, { variables: { id: agentId } });
  const speechAvailable = !!data?.agent?.config?.speech?.enabled;

  const client = useApolloClient();
  const { token } = useAuth();
  const player = useAudioPlayer(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const playMessage = useCallback(
    async (logId: string) => {
      try {
        const { data: result } = await client.query({
          query: SpeechUrlQuery,
          variables: { logId },
          fetchPolicy: "network-only",
        });

        const url = result?.speechUrl;
        if (!url) return;

        player.pause();
        player.replace({
          uri: url,
          headers: tokenRef.current
            ? { Authorization: `Bearer ${tokenRef.current}` }
            : undefined,
        });
        player.play();
      } catch (_err) {
        clientLogger.warn("Failed to play speech for log", { logId });
      }
    },
    [client, player],
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
