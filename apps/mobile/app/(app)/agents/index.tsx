import { useQuery } from "@apollo/client";
import { router, useFocusEffect } from "expo-router";
import { Bot, Plus, Settings } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text } from "react-native";
import type { AgentsQuery as AgentsQueryType } from "../../../src/graphql/generated/graphql";
import { AgentsQuery } from "../../../src/graphql/queries";
import { useListRefresh } from "../../../src/hooks/useListRefresh";
import { useNavigationTheme } from "../../../src/lib/useNavigationTheme";
import { Button } from "../../../src/shared/Button";
import { EmptyState } from "../../../src/shared/EmptyState";
import { ListCard } from "../../../src/shared/ListCard";
import { QueryGate } from "../../../src/shared/QueryResult";
import { TabScrollView } from "../../../src/shared/TabScrollView";

type Agent = AgentsQueryType["agents"][number];

const AgentCard = React.memo(function AgentCard({ agent }: { agent: Agent }) {
  const colors = useNavigationTheme();
  return (
    <ListCard
      agentId={agent.id}
      title={agent.name}
      titleHexColor={agent.hexColor}
      href={`/agents/${agent.id}`}
      badge={
        agent.retired ? (
          <Text className="text-sm text-text-muted">Retired</Text>
        ) : null
      }
      subtitle={
        <Text className="text-sm text-text-muted" numberOfLines={2}>
          {agent.role}
        </Text>
      }
      trailing={
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/agents/${agent.id}/config`);
          }}
          className="shrink-0 w-10 h-10 items-center justify-center rounded-lg active:bg-surface-alt"
        >
          <Settings size={20} color={colors.iconMuted} />
        </Pressable>
      }
    />
  );
});

export default function AgentsScreen() {
  const colors = useNavigationTheme();
  const { data, loading, error, refetch } = useQuery(AgentsQuery);
  const [showRetired, setShowRetired] = useState(false);
  const { refreshing, onRefresh } = useListRefresh(refetch);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const allAgents = data?.agents ?? [];
  const activeAgents = useMemo(
    () => allAgents.filter((a) => !a.retired),
    [allAgents],
  );
  const retiredAgents = useMemo(
    () => allAgents.filter((a) => a.retired),
    [allAgents],
  );

  return (
    <QueryGate loading={loading} error={error} data={data} onRetry={refetch}>
      <TabScrollView
        contentContainerClassName="px-4 pt-3 gap-3 grow"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.loadingIndicator}
          />
        }
      >
        {activeAgents.length === 0 && (
          <EmptyState
            message="No agents yet"
            description="Create your first agent to get started."
            icon={<Bot size={32} color={colors.iconMuted} />}
            actionLabel="Create Agent"
            onAction={() => router.push("/agents/new")}
          />
        )}

        {activeAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}

        {activeAgents.length > 0 && (
          <Button
            onPress={() => router.push("/agents/new")}
            variant="secondary"
            size="lg"
            icon={<Plus size={16} color={colors.accent} />}
          >
            New Agent
          </Button>
        )}

        {retiredAgents.length > 0 ? (
          <>
            <Pressable
              onPress={() => setShowRetired((v) => !v)}
              className="self-start py-1"
            >
              <Text className="text-sm text-text-muted">
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
      </TabScrollView>
    </QueryGate>
  );
}
