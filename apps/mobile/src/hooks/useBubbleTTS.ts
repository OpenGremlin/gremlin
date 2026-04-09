import { useApolloClient, useQuery } from "@apollo/client";
import { useAudioPlayer } from "expo-audio";
import { useCallback, useRef } from "react";
import { ActionSheetIOS, Platform } from "react-native";
import { AgentQuery, SpeechUrlQuery } from "../graphql/queries";
import { useAuth } from "../lib/AuthContext";
import { haptics } from "../lib/haptics";
import { clientLogger } from "../lib/logger";

/**
 * Provides a long-press handler that offers "Play as Speech" for an agent
 * bubble. Call once per chat screen, not per message.
 */
export function useBubbleTTS(agentId: string) {
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
    (logId: string) => {
      if (!speechAvailable) return;
      haptics.medium();

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Play as Speech", "Cancel"],
            cancelButtonIndex: 1,
          },
          (index) => {
            if (index === 0) playMessage(logId);
          },
        );
      } else {
        playMessage(logId);
      }
    },
    [speechAvailable, playMessage],
  );

  return { speechAvailable, handleLongPress };
}
