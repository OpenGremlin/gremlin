import { router, Stack, useLocalSearchParams } from "expo-router";
import { Monitor } from "lucide-react-native";
import { Pressable } from "react-native";
import { AgentQuery } from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { ChatScreen } from "../../../../src/shared/ChatScreen";

export default function AgentChatScreen() {
  const colors = useNavigationTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: agentData,
    loading,
    error,
  } = useQuery(AgentQuery, { id: id ?? "" });

  const agent = agentData?.agent;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatScreen
        agentId={id}
        title={agent?.name ?? ""}
        headerTitlePress={() => router.push(`/agents/${id}/config`)}
        headerRight={
          <Pressable onPress={() => router.push(`/agents/${id}/canvas`)}>
            <Monitor size={22} color={colors.headerText} />
          </Pressable>
        }
        loading={loading}
        error={error}
        notFound={!loading && !error && !agent}
        notFoundLabel="Agent not found"
        disabled={!!agent?.retired}
      />
    </>
  );
}
