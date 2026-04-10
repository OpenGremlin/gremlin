import { useQuery } from "@apollo/client";
import { router } from "expo-router";
import { CircleCheck, Info, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  AgentSkillsQuery,
  BindAgentSkillConnectionMutation,
  RemoveSkillMutation,
  UnbindAgentSkillConnectionMutation,
} from "../../graphql/queries";
import { IntegrationConnectionsQuery } from "../../graphql/queries/integrations";
import { execute } from "../../lib/apolloClient";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { AddSkillPicker } from "../AddSkillPicker";
import { Card } from "../Card";
import { ConnectionPicker } from "./ConnectionPicker";

export function SkillsConfig({ agentId }: { agentId: string }) {
  const colors = useNavigationTheme();
  const {
    data: skillsData,
    loading,
    refetch,
  } = useQuery(AgentSkillsQuery, { variables: { agentId } });
  const agentSkills = skillsData?.agentSkills ?? [];

  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const handleRemove = useCallback(
    async (skillId: string) => {
      await execute(RemoveSkillMutation, { agentId, skillId });
      refetch();
    },
    [agentId, refetch],
  );

  const [addSkillVisible, setAddSkillVisible] = useState(false);

  const openDetailSheet = (id: string) => {
    router.push(`/skill/${id}`);
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Skills
        </Text>
        <Pressable
          onPress={() => setAddSkillVisible(true)}
          className="flex-row items-center gap-1 px-2 py-1 rounded-md active:bg-surface-alt"
        >
          <Plus size={14} color={colors.iconDefault} />
          <Text className="text-xs text-text-muted">Add</Text>
        </Pressable>
      </View>

      {loading && (
        <View className="items-center py-4">
          <ActivityIndicator size="small" color={colors.iconDefault} />
        </View>
      )}

      {agentSkills.length === 0 && !loading && (
        <Card className="px-4 py-3">
          <Text className="text-sm text-text-muted">
            No skills assigned. Add skills to extend this agent's capabilities.
          </Text>
        </Card>
      )}

      {agentSkills.map((skill) => (
        <AgentSkillCard
          key={skill.skillId}
          skill={skill}
          agentId={agentId}
          expanded={expandedSkill === skill.skillId}
          onToggleExpand={() =>
            setExpandedSkill(
              expandedSkill === skill.skillId ? null : skill.skillId,
            )
          }
          onRemove={() => handleRemove(skill.skillId)}
          onConnectionChanged={refetch}
          onShowDetails={() => openDetailSheet(skill.skillId)}
        />
      ))}

      <AddSkillPicker
        visible={addSkillVisible}
        agentId={agentId}
        assignedSkillIds={agentSkills.map((s) => s.skillId)}
        onAssigned={refetch}
        onDismiss={() => setAddSkillVisible(false)}
      />
    </View>
  );
}

function AgentSkillCard({
  skill,
  agentId,
  expanded,
  onToggleExpand,
  onRemove,
  onConnectionChanged,
  onShowDetails,
}: {
  skill: {
    skillId: string;
    template?: {
      name: string;
      displayName?: string | null;
      description: string;
      icon?: string | null;
      connections: ReadonlyArray<{
        provider: string;
        providerName: string;
        reason: string;
        optional?: boolean | null;
        multi?: boolean | null;
      }>;
    } | null;
    connectionStatuses: ReadonlyArray<{
      provider: string;
      providerName: string;
      multi?: boolean | null;
      boundConnectionIds: readonly string[];
      connected: boolean;
    }>;
  };
  agentId: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onConnectionChanged: () => void;
  onShowDetails: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const { data: connectionsData } = useQuery(IntegrationConnectionsQuery);
  const connections = connectionsData?.integrationConnections ?? [];

  const colors = useNavigationTheme();
  const template = skill.template;
  if (!template) {
    return (
      <Card className="px-4 py-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm text-text-muted">
            {skill.skillId} (not found)
          </Text>
        </View>
        <Pressable
          onPress={async () => {
            setRemoving(true);
            await onRemove();
          }}
          disabled={removing}
        >
          <Trash2 size={16} color="#ef4444" />
        </Pressable>
      </Card>
    );
  }

  const hasConnections = template.connections.length > 0;
  const allConnected = skill.connectionStatuses.every(
    (cs) =>
      cs.connected ||
      !template.connections.find(
        (c) => c.provider === cs.provider && !c.optional,
      ),
  );

  // Build selected map: provider -> connectionId[]
  const selectedConnections: Record<string, string[]> = {};
  for (const cs of skill.connectionStatuses) {
    if (cs.boundConnectionIds.length > 0) {
      selectedConnections[cs.provider] = [...cs.boundConnectionIds];
    }
  }

  // Count total bound connections for badge
  const totalBound = skill.connectionStatuses.reduce(
    (sum, cs) => sum + cs.boundConnectionIds.length,
    0,
  );

  async function handleBindConnection(provider: string, connectionId: string) {
    await execute(BindAgentSkillConnectionMutation, {
      agentId,
      skillId: skill.skillId,
      provider,
      connectionId,
    });
    onConnectionChanged();
  }

  async function handleUnbindConnection(
    provider: string,
    connectionId: string,
  ) {
    await execute(UnbindAgentSkillConnectionMutation, {
      agentId,
      skillId: skill.skillId,
      provider,
      connectionId,
    });
    onConnectionChanged();
  }

  return (
    <Card className="overflow-hidden">
      <Pressable
        onPress={hasConnections ? onToggleExpand : undefined}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-medium text-text-primary">
            {template.displayName ?? template.name}
          </Text>
          <Text className="text-xs text-text-muted" numberOfLines={1}>
            {template.description}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 shrink-0">
          {hasConnections && (
            <View className="flex-row items-center gap-1">
              <CircleCheck
                size={12}
                color={allConnected ? "#059669" : "#d97706"}
              />
              <Text
                className={`text-xs ${allConnected ? "text-emerald-600" : "text-amber-500"}`}
              >
                {allConnected
                  ? totalBound > 1
                    ? `${totalBound} connected`
                    : "Connected"
                  : "Setup needed"}
              </Text>
            </View>
          )}
          <Pressable onPress={onShowDetails} hitSlop={6} className="p-1">
            <Info size={14} color={colors.iconDefault} />
          </Pressable>
          <Pressable
            onPress={async () => {
              setRemoving(true);
              await onRemove();
            }}
            disabled={removing}
            className="p-1"
          >
            {removing ? (
              <ActivityIndicator size="small" />
            ) : (
              <Trash2 size={14} color="#ef4444" />
            )}
          </Pressable>
        </View>
      </Pressable>

      {expanded && hasConnections && (
        <View className="px-4 pb-3">
          <ConnectionPicker
            requirements={template.connections}
            connections={connections}
            selected={selectedConnections}
            onSelect={handleBindConnection}
            onDeselect={handleUnbindConnection}
          />
        </View>
      )}
    </Card>
  );
}
