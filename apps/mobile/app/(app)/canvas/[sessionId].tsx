import { useQuery } from "@apollo/client";
import { router, useLocalSearchParams } from "expo-router";
import { Bot, Check, Share2, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import { AgentsQuery } from "../../../src/graphql/queries";
import {
  bindCanvasAgent,
  endCanvasSession,
  getActiveSession,
} from "../../../src/lib/canvasApi";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { DestructiveButton } from "../../../src/shared/DestructiveButton";
import { TabScrollView } from "../../../src/shared/TabScrollView";

export default function DeviceDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const colors = useNavigationTheme();
  const session = sessionId ? getActiveSession(sessionId) : null;

  const { data } = useQuery(AgentsQuery);
  const agents = (data?.agents ?? []).filter((a) => !a.retired);

  const [boundAgentId, setBoundAgentId] = useState<string | null>(
    session?.currentAgentId ?? null,
  );
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const handleBind = useCallback(
    async (agentId: string | null) => {
      if (!session || pendingAgentId !== null) return;
      setPendingAgentId(agentId ?? "__unbind__");
      try {
        await bindCanvasAgent(session.sessionId, agentId);
        setBoundAgentId(agentId);
      } finally {
        setPendingAgentId(null);
      }
    },
    [session, pendingAgentId],
  );

  const handleEnd = useCallback(async () => {
    if (!session || ending) return;
    setEnding(true);
    try {
      await endCanvasSession(session.sessionId);
      router.back();
    } finally {
      setEnding(false);
    }
  }, [session, ending]);

  if (!session) {
    return (
      <TabScrollView contentContainerClassName="px-4 pt-3 gap-4 grow items-center justify-center">
        <Text className="text-text-secondary text-sm">
          Session not found. It may have expired.
        </Text>
      </TabScrollView>
    );
  }

  return (
    <TabScrollView contentContainerClassName="px-4 pt-3 gap-4 grow">
      <View className="px-1">
        <Text className="text-text-secondary text-sm">Casting to</Text>
        <Text className="text-text-primary text-2xl font-semibold mt-1">
          {session.targetLabel}
        </Text>
      </View>

      {session.targetLabel === "Browser" && (
        <Pressable
          onPress={() => {
            Share.share({
              url: session.browserUrl,
              message: session.browserUrl,
              title: "Open canvas",
            }).catch(() => {});
          }}
          className="flex-row items-center gap-3 p-4 rounded-xl bg-surface-raised active:opacity-70"
        >
          <Share2 size={20} color={colors.iconMuted} />
          <View className="flex-1">
            <Text className="text-text-primary text-base font-medium">
              Share link
            </Text>
            <Text
              className="text-text-muted text-xs mt-0.5"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {session.browserUrl}
            </Text>
          </View>
        </Pressable>
      )}

      <View className="gap-2">
        <Text className="text-text-secondary text-sm px-1">
          Currently showing
        </Text>
        {agents.length === 0 ? (
          <View className="px-4 py-4 rounded-xl bg-surface-raised">
            <Text className="text-text-muted text-sm">No agents available</Text>
          </View>
        ) : (
          <View className="gap-1">
            {agents.map((agent) => {
              const isBound = boundAgentId === agent.id;
              const isPending = pendingAgentId === agent.id;
              return (
                <Pressable
                  key={agent.id}
                  onPress={() => handleBind(isBound ? null : agent.id)}
                  disabled={pendingAgentId !== null}
                  className="flex-row items-center gap-3 p-4 rounded-xl bg-surface-raised active:opacity-70"
                >
                  <Bot size={20} color={agent.hexColor ?? colors.iconMuted} />
                  <Text className="flex-1 text-text-primary text-base font-medium">
                    {agent.name}
                  </Text>
                  {isPending ? (
                    <ActivityIndicator color={colors.iconMuted} />
                  ) : isBound ? (
                    <Check size={20} color={colors.tabBarActive} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
        {boundAgentId !== null && (
          <Pressable
            onPress={() => handleBind(null)}
            disabled={pendingAgentId !== null}
            className="flex-row items-center gap-2 px-4 py-3 active:opacity-70"
          >
            <X size={16} color={colors.iconMuted} />
            <Text className="text-text-secondary text-sm">Stop showing</Text>
          </Pressable>
        )}
      </View>

      <View className="mt-auto pb-4">
        <DestructiveButton
          onPress={handleEnd}
          label="End cast"
          loadingLabel="Ending…"
          loading={ending}
          disabled={ending}
        />
      </View>
    </TabScrollView>
  );
}
