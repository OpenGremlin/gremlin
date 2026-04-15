import { useQuery } from "@apollo/client";
import { router, Stack, useIsPreview, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { AgentQuery } from "../../../../src/graphql/queries";
import { ChatScreen } from "../../../../src/shared/ChatScreen";
import { VoiceModeButton } from "../../../../src/shared/VoiceModeButton";

export default function AgentChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPreview = useIsPreview();

  const {
    data: agentData,
    loading,
    error,
    refetch,
  } = useQuery(AgentQuery, { variables: { id: id ?? "" } });

  const agent = agentData?.agent;
  const headerTitlePress = useCallback(
    () => router.push(`/agents/${id}/config`),
    [id],
  );

  return (
    <>
      {!isPreview && <Stack.Screen options={{ headerShown: false }} />}
      <ChatScreen
        agentId={id}
        title={agent?.name ?? ""}
        headerTitlePress={headerTitlePress}
        headerRight={<VoiceModeButton agentId={id} />}
        loading={loading}
        error={error}
        onRetry={refetch}
        notFound={!loading && !error && !agent}
        notFoundLabel="Agent not found"
        disabled={!!agent?.retired}
      />
    </>
  );
}
