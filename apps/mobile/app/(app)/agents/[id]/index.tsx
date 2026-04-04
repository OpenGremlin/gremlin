import { useQuery } from "@apollo/client";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { AgentQuery } from "../../../../src/graphql/queries";
import { useVoiceMode } from "../../../../src/hooks/useVoiceMode";
import { useVoiceModeContext } from "../../../../src/lib/VoiceModeContext";
import { ChatScreen } from "../../../../src/shared/ChatScreen";
import { VoiceModeButton } from "../../../../src/shared/VoiceModeButton";

export default function AgentChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { voiceEnabled } = useVoiceModeContext();
  const { enqueue: enqueueSpeech } = useVoiceMode(voiceEnabled);

  const {
    data: agentData,
    loading,
    error,
    refetch,
  } = useQuery(AgentQuery, { variables: { id: id ?? "" } });

  const agent = agentData?.agent;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatScreen
        agentId={id}
        title={agent?.name ?? ""}
        headerTitlePress={() => router.push(`/agents/${id}/config`)}
        headerRight={<VoiceModeButton agentId={id} />}
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
