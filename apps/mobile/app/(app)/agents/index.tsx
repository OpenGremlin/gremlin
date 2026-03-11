import { router } from "expo-router";
import { Plus, Settings } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import type { AgentsQuery as AgentsQueryType } from "../../../src/graphql/generated/graphql";
import { AgentsQuery } from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { ListCard } from "../../../src/shared/ListCard";
import { QueryResult } from "../../../src/shared/QueryResult";

type Agent = AgentsQueryType["agents"][number];

function AgentCard({ agent }: { agent: Agent }) {
  const colors = useNavigationTheme();
  return (
    <ListCard
      agentId={agent.id}
      title={agent.name}
      onPress={() => router.push(`/agents/${agent.id}`)}
      badge={
        agent.retired ? (
          <Text className="text-xs text-text-muted">Retired</Text>
        ) : null
      }
      subtitle={
        <Text className="text-xs text-text-muted" numberOfLines={2}>
          {agent.soul}
        </Text>
      }
      trailing={
        <Pressable
          onPress={() => router.push(`/agents/${agent.id}/config`)}
          className="shrink-0 w-8 h-8 items-center justify-center rounded-lg active:bg-surface-alt"
        >
          <Settings size={16} color={colors.iconMuted} />
        </Pressable>
      }
    />
  );
}

export default function AgentsScreen() {
  const colors = useNavigationTheme();
  const { data, loading, error } = useQuery(AgentsQuery);
  const [showRetired, setShowRetired] = useState(false);

  const allAgents = data?.agents ?? [];
  const activeAgents = allAgents.filter((a) => !a.retired);
  const retiredAgents = allAgents.filter((a) => a.retired);

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 gap-3">
      <QueryResult loading={loading} error={error} />

      {activeAgents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}

      <Pressable
        onPress={() => router.push("/agents/new")}
        className="self-start flex-row items-center gap-1.5 py-2"
      >
        <Plus size={14} color={colors.iconMuted} />
        <Text className="text-xs text-text-muted">New Agent</Text>
      </Pressable>

      {retiredAgents.length > 0 ? (
        <>
          <Pressable
            onPress={() => setShowRetired((v) => !v)}
            className="self-start py-1"
          >
            <Text className="text-xs text-text-muted">
              {showRetired
                ? "Hide retired agents"
                : `Show retired agents (${retiredAgents.length})`}
            </Text>
          </Pressable>

          {showRetired
            ? retiredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))
            : null}
        </>
      ) : null}
    </ScrollView>
  );
}
