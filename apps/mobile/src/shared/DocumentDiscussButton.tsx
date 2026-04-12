import { useQuery } from "@apollo/client";
import { router } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { AgentsQuery, AttachFileReferenceMutation } from "../graphql/queries";
import { execute } from "../lib/apolloClient";
import { useLocalSettings } from "../lib/LocalSettingsContext";
import { clientLogger } from "../lib/logger";
import { useTheme } from "../lib/ThemeContext";
import { AgentAvatar } from "./AgentAvatar";
import { presentPicker } from "./PickerModal";

const AVATAR_SIZE = 36;
const CARD_RADIUS = 10;
const CARD_INNER_RADIUS = CARD_RADIUS;

export function DocumentDiscussButton({ filePath }: { filePath: string }) {
  const { data } = useQuery(AgentsQuery);
  const { isDark } = useTheme();
  const { documentDiscussAgentId, setDocumentDiscussAgentId } =
    useLocalSettings();

  const agents = useMemo(
    () => (data?.agents ?? []).filter((a) => !a.retired),
    [data?.agents],
  );

  const agent = useMemo(() => {
    if (agents.length === 0) return null;
    if (documentDiscussAgentId) {
      const match = agents.find((a) => a.id === documentDiscussAgentId);
      if (match) return match;
    }
    return agents[0];
  }, [agents, documentDiscussAgentId]);

  const pickAgent = useCallback(() => {
    if (agents.length === 0) return;
    presentPicker({
      title: "Discuss with",
      options: agents.map((a) => ({
        value: a.id,
        label: a.name,
        subtitle: a.role ?? undefined,
        icon: <AgentAvatar id={a.id} size={28} />,
      })),
      selected: agent?.id,
      onSelect: setDocumentDiscussAgentId,
    });
  }, [agents, agent?.id, setDocumentDiscussAgentId]);

  const handlePress = useCallback(() => {
    if (!agent) return;
    // Dismiss the file preview formSheet first, then navigate to the agent
    // chat. Without this the sheet stays stuck behind the new screen.
    router.dismiss();
    setTimeout(() => {
      router.push(`/agents/${agent.id}`);
    }, 0);
    execute(AttachFileReferenceMutation, {
      input: { agentId: agent.id, filePath },
    }).catch((err) => {
      clientLogger.error("Failed to attach file reference", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, [agent, filePath]);

  if (agents.length === 0 || !agent) return null;

  const accentColor = isDark ? "#34d399" : "#059669";

  return (
    <View
      style={{
        borderRadius: CARD_RADIUS,
        backgroundColor: isDark ? "#022c22" : "#ecfdf5",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <View
        className="flex-row items-stretch"
        style={{ minHeight: AVATAR_SIZE }}
      >
        <Pressable onPress={pickAgent}>
          <AgentAvatar
            id={agent.id}
            size={AVATAR_SIZE}
            cornerStyle={{
              borderTopLeftRadius: CARD_INNER_RADIUS,
              borderBottomLeftRadius: CARD_INNER_RADIUS,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
            hideManagerBadge
          />
        </Pressable>
        <Pressable
          onPress={handlePress}
          className="flex-1 flex-row items-center gap-2 px-3"
        >
          <MessageSquare size={16} color={accentColor} />
          <Text
            className="text-sm font-medium"
            style={{ color: isDark ? "#a7f3d0" : "#065f46" }}
          >
            Discuss
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
