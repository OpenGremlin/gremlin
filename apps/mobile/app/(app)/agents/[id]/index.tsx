import { useQuery } from "@apollo/client";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Volume2, VolumeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { AgentQuery } from "../../../../src/graphql/queries";
import { useVoiceMode } from "../../../../src/hooks/useVoiceMode";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { ChatScreen } from "../../../../src/shared/ChatScreen";

export default function AgentChatScreen() {
  const colors = useNavigationTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { enqueue: enqueueSpeech } = useVoiceMode(voiceEnabled);

  const {
    data: agentData,
    loading,
    error,
    refetch,
  } = useQuery(AgentQuery, { variables: { id: id ?? "" } });

  const agent = agentData?.agent;
  const speechAvailable = !!agent?.config?.speech?.enabled;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatScreen
        agentId={id}
        title={agent?.name ?? ""}
        headerTitlePress={() => router.push(`/agents/${id}/config`)}
        headerRight={
          speechAvailable ? (
            <Pressable onPress={() => setVoiceEnabled((v) => !v)}>
              {voiceEnabled ? (
                <Volume2 size={22} color={colors.accentIndicator} />
              ) : (
                <VolumeOff size={22} color={colors.headerText} />
              )}
            </Pressable>
          ) : undefined
        }
        loading={loading}
        error={error}
        onRetry={refetch}
        notFound={!loading && !error && !agent}
        notFoundLabel="Agent not found"
        disabled={!!agent?.retired}
        onAgentLogCreated={voiceEnabled ? enqueueSpeech : undefined}
      />
    </>
  );
}
