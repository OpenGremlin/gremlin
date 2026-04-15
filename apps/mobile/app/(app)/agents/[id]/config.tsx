import { useQuery } from "@apollo/client";
import { useLocalSearchParams } from "expo-router";
import { Check, Crown, Pencil } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AgentQuery,
  AgentsQuery,
  AvatarsQuery,
  RetireAgentMutation,
  UnretireAgentMutation,
  UpdateAgentMutation,
} from "../../../../src/graphql/queries";
import { useAutosaveFields } from "../../../../src/hooks/useAutosaveFields";
import { execute } from "../../../../src/lib/apolloClient";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { AgentAvatar } from "../../../../src/shared/AgentAvatar";
import { AvatarPicker } from "../../../../src/shared/AgentAvatar/AvatarPicker";
import { Button } from "../../../../src/shared/Button";
import { Card } from "../../../../src/shared/Card";
import { ConfirmDialog } from "../../../../src/shared/ConfirmDialog";
import { DestructiveButton } from "../../../../src/shared/DestructiveButton";
import { Input } from "../../../../src/shared/Input";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";
import { SkillsConfig } from "../../../../src/shared/SkillsConfig";
import { TabScrollView } from "../../../../src/shared/TabScrollView";
import { Toggle } from "../../../../src/shared/Toggle";
import { ToolsConfig, toPlainConfig } from "../../../../src/shared/ToolsConfig";

export default function AgentConfigScreen() {
  const colors = useNavigationTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, refetch } = useQuery(AgentQuery, {
    variables: { id: id ?? "" },
  });
  const agent = data?.agent;
  const avatarsResult = useQuery(AvatarsQuery);

  const [managerEnabled, setManagerEnabled] = useState(false);
  const [team, setTeam] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const [retiring, setRetiring] = useState(false);

  const saveFields = useCallback(
    (fields: { name: string; personality: string; role: string; delegationHint: string }) => {
      setSaveError("");
      return execute(UpdateAgentMutation, {
        id: id ?? "",
        input: {
          name: fields.name,
          personality: fields.personality,
          role: fields.role || null,
          delegationHint: fields.delegationHint || null,
        },
      }).catch((err) =>
        setSaveError(err instanceof Error ? err.message : "Failed to save changes"),
      );
    },
    [id],
  );

  const { name, personality, role, delegationHint, update, syncFromServer } =
    useAutosaveFields(saveFields);

  // Used by the team picker — fetched lazily once the user expands manager mode.
  const allAgentsResult = useQuery(AgentsQuery, { skip: !managerEnabled });
  const teamCandidates = useMemo(
    () =>
      (allAgentsResult.data?.agents ?? []).filter(
        (a) => a.id !== id && !a.retired,
      ),
    [allAgentsResult.data, id],
  );
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);

  useEffect(() => {
    if (!agent) return;
    syncFromServer({
      name: agent.name,
      personality: agent.personality ?? "",
      role: agent.role ?? "",
      delegationHint: agent.delegationHint ?? "",
    });
    setManagerEnabled(agent.config?.manager?.enabled ?? false);
    setTeam(agent.config?.manager?.team ?? []);
  }, [agent, syncFromServer]);

  // Immediately save manager config changes, merging with current server config
  // to avoid clobbering model/tools settings
  const saveManagerConfig = useCallback(
    (enabled: boolean, memberIds: string[]) => {
      if (!agent) return;
      const merged = {
        ...toPlainConfig(agent.config),
        manager: enabled
          ? { enabled: true, team: memberIds }
          : { enabled: false, team: [] as string[] },
      };

      setSaveError("");
      execute(UpdateAgentMutation, {
        id: id ?? "",
        input: { config: merged },
      }).catch((err) =>
        setSaveError(
          err instanceof Error ? err.message : "Failed to save changes",
        ),
      );
    },
    [id, agent],
  );

  const [showRetireConfirm, setShowRetireConfirm] = useState(false);

  const doRetire = useCallback(async () => {
    setShowRetireConfirm(false);
    setRetiring(true);
    try {
      await execute(RetireAgentMutation, { id: id ?? "" });
      refetch();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to retire agent",
      );
    } finally {
      setRetiring(false);
    }
  }, [id, refetch]);

  const doUnretire = useCallback(async () => {
    setRetiring(true);
    try {
      await execute(UnretireAgentMutation, { id: id ?? "" });
      refetch();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to restore agent",
      );
    } finally {
      setRetiring(false);
    }
  }, [id, refetch]);

  if (loading) {
    return <QueryResult loading error={null} />;
  }
  if (error) {
    return <QueryResult loading={false} error={error} />;
  }
  if (!agent) {
    return <NotFound label="Agent not found" />;
  }

  const toggleTeamMember = (memberId: string) => {
    setTeam((prev) => {
      const next = prev.includes(memberId)
        ? prev.filter((m) => m !== memberId)
        : [...prev, memberId];
      saveManagerConfig(managerEnabled, next);
      return next;
    });
  };

  return (
    <TabScrollView
      contentContainerClassName="px-4 pt-6 gap-6"
      keyboardShouldPersistTaps="handled"
    >
      {agent.retired && (
        <Card className="px-4 py-3 flex-row items-center justify-between">
          <Text className="text-sm text-text-muted">
            This agent is retired.
          </Text>
          <Button onPress={doUnretire} loading={retiring} size="sm">
            Restore
          </Button>
        </Card>
      )}

      <View className="items-center">
        <Pressable
          onPress={
            agent.retired ? undefined : () => setAvatarPickerVisible(true)
          }
          disabled={!!agent.retired}
          className="relative"
        >
          <AgentAvatar
            key={`${id}-${agent.retired}-${agent.avatar}`}
            id={id}
            size={80}
          />
          {!agent.retired && (
            <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-surface-alt border-2 border-bg items-center justify-center">
              <Pencil size={12} color={colors.headerText} />
            </View>
          )}
        </Pressable>
      </View>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-text-secondary">Name</Text>
        <Input
          value={name}
          onChangeText={(v) => update("name", v)}
          placeholder="Agent name"
          editable={!agent.retired}
        />
      </View>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-text-secondary">
          Personality
        </Text>
        <Text className="text-xs text-text-muted">
          Mannerisms, tone, and voice
        </Text>
        <Input
          value={personality}
          onChangeText={(v) => update("personality", v)}
          placeholder="e.g. Warm and curious, explains things with analogies, asks clarifying questions before diving in."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
          editable={!agent.retired}
        />
      </View>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-text-secondary">Role</Text>
        <Text className="text-xs text-text-muted">
          Expertise and responsibilities
        </Text>
        <Input
          value={role}
          onChangeText={(v) => update("role", v)}
          placeholder="e.g. A senior backend engineer who reviews PRs and helps debug production issues."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
          editable={!agent.retired}
        />
      </View>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-text-secondary">
          When to Delegate?
        </Text>
        <Text className="text-xs text-text-muted">
          Managers with this agent on their team read this to decide whether to
          delegate. Be specific.
        </Text>
        <Input
          value={delegationHint}
          onChangeText={(v) => update("delegationHint", v)}
          placeholder="e.g. When the task needs access to AWS logs or CloudWatch metrics to diagnose production issues."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
          editable={!agent.retired}
        />
      </View>

      {!agent.retired && (
        <Card className="overflow-hidden">
          <View className="flex-row px-4 py-3 gap-3">
            <View className="w-[22px] pt-0.5">
              <Crown size={22} color="#F5C518" fill="#F5C518" strokeWidth={2} />
            </View>
            <View className="flex-1 gap-3">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-base font-bold text-text-secondary">
                    Manager Mode
                  </Text>
                  <Text className="text-xs text-text-muted">
                    Lets this agent delegate tasks to a chosen team.
                  </Text>
                </View>
                <Toggle
                  enabled={managerEnabled}
                  onChange={() => {
                    const next = !managerEnabled;
                    setManagerEnabled(next);
                    saveManagerConfig(next, next ? team : []);
                  }}
                />
              </View>

              {managerEnabled && (
                <View className="gap-2">
                  <Text className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Team
                  </Text>
                  {allAgentsResult.loading && teamCandidates.length === 0 ? (
                    <Text className="text-xs text-text-muted">
                      Loading agents…
                    </Text>
                  ) : teamCandidates.length === 0 ? (
                    <Text className="text-xs text-text-muted">
                      No other agents available.
                    </Text>
                  ) : (
                    <View className="gap-1">
                      {teamCandidates.map((member) => {
                        const selected = team.includes(member.id);
                        return (
                          <Pressable
                            key={member.id}
                            onPress={() => toggleTeamMember(member.id)}
                            className="rounded-xl overflow-hidden"
                          >
                            <View
                              className={
                                selected ? "bg-accent-surface" : "bg-surface"
                              }
                              style={{
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: selected
                                  ? colors.accent
                                  : colors.border,
                              }}
                            >
                              <View
                                className="flex-row items-stretch"
                                style={{ minHeight: 48 }}
                              >
                                <AgentAvatar
                                  id={member.id}
                                  size={48}
                                  hideManagerBadge
                                  cornerStyle={{
                                    borderTopLeftRadius: 11,
                                    borderBottomLeftRadius: 11,
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                  }}
                                />
                                <View className="flex-1 min-w-0 justify-center px-3 py-2">
                                  <Text
                                    className="text-sm font-medium text-text-primary"
                                    numberOfLines={1}
                                  >
                                    {member.name}
                                  </Text>
                                  {member.delegationHint ? (
                                    <Text
                                      className="text-xs text-text-muted mt-0.5"
                                      numberOfLines={2}
                                    >
                                      {member.delegationHint}
                                    </Text>
                                  ) : (
                                    <Text className="text-xs text-text-muted italic mt-0.5">
                                      No hint set
                                    </Text>
                                  )}
                                </View>
                                {selected && (
                                  <View className="justify-center pr-3">
                                    <Check
                                      size={18}
                                      color={colors.headerText}
                                    />
                                  </View>
                                )}
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Card>
      )}

      {saveError ? (
        <Text className="text-error text-sm">{saveError}</Text>
      ) : null}

      {!agent.retired && (
        <>
          <ToolsConfig agent={agent} />

          <SkillsConfig agentId={agent.id} />

          <View className="mt-4">
            <DestructiveButton
              onPress={() => setShowRetireConfirm(true)}
              loading={retiring}
              label="Retire Agent"
              size="lg"
            />
          </View>
        </>
      )}

      <ConfirmDialog
        visible={showRetireConfirm}
        title="Retire Agent"
        message="This agent will no longer receive messages."
        confirmLabel="Retire"
        destructive
        onConfirm={doRetire}
        onCancel={() => setShowRetireConfirm(false)}
      />
      <AvatarPicker
        visible={avatarPickerVisible}
        avatars={avatarsResult.data?.avatars ?? []}
        loading={avatarsResult.loading}
        onSelect={async (avatar) => {
          try {
            await execute(UpdateAgentMutation, {
              id: id ?? "",
              input: { avatar: avatar.id },
            });
            refetch();
          } catch (err) {
            setSaveError(
              err instanceof Error ? err.message : "Failed to update avatar",
            );
          }
        }}
        onDismiss={() => setAvatarPickerVisible(false)}
      />
    </TabScrollView>
  );
}
