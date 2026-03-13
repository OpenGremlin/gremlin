import { CircleCheck, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  AgentSkillsQuery,
  AssignSkillMutation,
  BindAgentSkillConnectionMutation,
  RemoveSkillMutation,
  SkillTemplatesQuery,
} from "../../graphql/queries";
import { IntegrationConnectionsQuery } from "../../graphql/queries/integrations";
import { useQuery } from "../../hooks/useQuery";
import { gql } from "../../lib/auth";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { Card } from "../Card";
import { ConnectionPicker } from "../ConnectionPicker";
import { SheetModal } from "../SheetModal";

export function SkillsConfig({ agentId }: { agentId: string }) {
  const colors = useNavigationTheme();
  const {
    data: skillsData,
    loading,
    refetch,
  } = useQuery(AgentSkillsQuery, { agentId });
  const agentSkills = skillsData?.agentSkills ?? [];

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const handleRemove = useCallback(
    async (skillId: string) => {
      await gql(RemoveSkillMutation, { agentId, skillId });
      refetch();
    },
    [agentId, refetch],
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Skills
        </Text>
        <Pressable
          onPress={() => setAddModalOpen(true)}
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
          onConnectionBound={refetch}
        />
      ))}

      {addModalOpen && (
        <AddSkillModal
          agentId={agentId}
          assignedSkillIds={agentSkills.map((s) => s.skillId)}
          onDone={() => {
            setAddModalOpen(false);
            refetch();
          }}
          onClose={() => setAddModalOpen(false)}
        />
      )}
    </View>
  );
}

function AgentSkillCard({
  skill,
  agentId,
  expanded,
  onToggleExpand,
  onRemove,
  onConnectionBound,
}: {
  skill: {
    skillId: string;
    template?: {
      name: string;
      description: string;
      icon?: string | null;
      connections: ReadonlyArray<{
        provider: string;
        providerName: string;
        reason: string;
        optional?: boolean | null;
      }>;
    } | null;
    connectionStatuses: ReadonlyArray<{
      provider: string;
      providerName: string;
      boundConnectionId?: string | null;
      connected: boolean;
    }>;
  };
  agentId: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onConnectionBound: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const { data: connectionsData } = useQuery(IntegrationConnectionsQuery);
  const connections = connectionsData?.integrationConnections ?? [];

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

  const selectedConnections: Record<string, string> = {};
  for (const cs of skill.connectionStatuses) {
    if (cs.boundConnectionId) {
      selectedConnections[cs.provider] = cs.boundConnectionId;
    }
  }

  async function handleBindConnection(provider: string, connectionId: string) {
    await gql(BindAgentSkillConnectionMutation, {
      agentId,
      skillId: skill.skillId,
      provider,
      connectionId,
    });
    onConnectionBound();
  }

  return (
    <Card className="overflow-hidden">
      <Pressable
        onPress={hasConnections ? onToggleExpand : undefined}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-medium text-text-primary">
            {template.name}
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
                {allConnected ? "Connected" : "Setup needed"}
              </Text>
            </View>
          )}
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
          />
        </View>
      )}
    </Card>
  );
}

function AddSkillModal({
  agentId,
  assignedSkillIds,
  onDone,
  onClose,
}: {
  agentId: string;
  assignedSkillIds: string[];
  onDone: () => void;
  onClose: () => void;
}) {
  const colors = useNavigationTheme();
  const { data, loading } = useQuery(SkillTemplatesQuery);
  const templates = data?.skillTemplates ?? [];
  const available = templates.filter((t) => !assignedSkillIds.includes(t.id));
  const [assigning, setAssigning] = useState<string | null>(null);

  async function handleAssign(skillId: string) {
    setAssigning(skillId);
    try {
      await gql(AssignSkillMutation, { agentId, skillId });
      onDone();
    } finally {
      setAssigning(null);
    }
  }

  return (
    <SheetModal visible title="Add Skill" onClose={onClose}>
      <ScrollView contentContainerClassName="px-4 py-3 gap-2">
        {loading && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color={colors.iconDefault} />
          </View>
        )}

        {available.length === 0 && !loading && (
          <Text className="text-sm text-text-muted py-4 text-center">
            All available skills are already assigned.
          </Text>
        )}

        {available.map((template) => (
          <Pressable
            key={template.id}
            onPress={() => handleAssign(template.id)}
            disabled={assigning !== null}
            className="bg-surface border border-app-border rounded-xl p-4 active:bg-surface-alt"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-medium text-text-primary">
                  {template.name}
                </Text>
                <Text
                  className="text-xs text-text-muted mt-0.5"
                  numberOfLines={2}
                >
                  {template.description}
                </Text>
                {template.connections.length > 0 && (
                  <Text className="text-[10px] text-text-muted mt-1">
                    Requires:{" "}
                    {template.connections.map((c) => c.providerName).join(", ")}
                  </Text>
                )}
              </View>
              {assigning === template.id ? (
                <ActivityIndicator size="small" color={colors.iconDefault} />
              ) : (
                <Plus size={18} color={colors.iconDefault} />
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SheetModal>
  );
}
