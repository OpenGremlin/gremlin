import { useLocalSearchParams } from "expo-router";
import { Pencil, Volume2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  AgentQuery,
  AvatarsQuery,
  RetireAgentMutation,
  UnretireAgentMutation,
  UpdateAgentMutation,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { mutate } from "../../../../src/lib/apolloClient";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { AgentAvatar } from "../../../../src/shared/AgentAvatar";
import { AvatarPicker } from "../../../../src/shared/AgentAvatar/AvatarPicker";
import { VoicePicker } from "../../../../src/shared/AgentAvatar/VoicePicker";
import { Button } from "../../../../src/shared/Button";
import { Card } from "../../../../src/shared/Card";
import { ConfirmDialog } from "../../../../src/shared/ConfirmDialog";
import { DestructiveButton } from "../../../../src/shared/DestructiveButton";
import { Input } from "../../../../src/shared/Input";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";
import { SaveButton } from "../../../../src/shared/SaveButton";
import { SkillsConfig } from "../../../../src/shared/SkillsConfig";
import { ToolsConfig } from "../../../../src/shared/ToolsConfig";

export default function AgentConfigScreen() {
  const colors = useNavigationTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, setData, refetch } = useQuery(AgentQuery, {
    id: id ?? "",
  });
  const agent = data?.agent;
  const avatarsResult = useQuery(AvatarsQuery);

  const [name, setName] = useState("");
  const [soul, setSoul] = useState("");
  const [identity, setIdentity] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [retiring, setRetiring] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);

  useEffect(() => {
    if (!agent) return;
    setName(agent.name);
    setSoul(agent.soul ?? "");
    setIdentity(agent.identity ?? "");
  }, [agent]);

  const handleSave = useCallback(async () => {
    if (!agent) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await mutate(UpdateAgentMutation, {
        id: id ?? "",
        input: {
          name: name.trim(),
          soul: soul.trim(),
          identity: identity.trim() || null,
        },
      });
      setData({ agent: result.updateAgent });
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save changes",
      );
    } finally {
      setSaving(false);
    }
  }, [id, agent, name, soul, identity, setData]);

  const [showRetireConfirm, setShowRetireConfirm] = useState(false);

  const doRetire = useCallback(async () => {
    setShowRetireConfirm(false);
    setRetiring(true);
    try {
      await mutate(RetireAgentMutation, { id: id ?? "" });
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
      await mutate(UnretireAgentMutation, { id: id ?? "" });
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

  const hasChanges =
    name.trim() !== agent.name ||
    soul.trim() !== (agent.soul ?? "") ||
    identity.trim() !== (agent.identity ?? "");

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-6"
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
          onPress={agent.retired ? undefined : () => setPickerOpen(true)}
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

      <Pressable
        onPress={agent.retired ? undefined : () => setVoicePickerOpen(true)}
        disabled={!!agent.retired}
        className={`self-center flex-row items-center gap-2 px-3 py-2 rounded-lg bg-surface-alt ${agent.retired ? "opacity-50" : "active:bg-surface-alt"}`}
      >
        <Volume2 size={16} color={colors.iconDefault} />
        <Text className="text-sm text-text-secondary">
          {agent.ttsVoice ?? "No voice"}
        </Text>
      </Pressable>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-text-secondary">Name</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Agent name"
          editable={!agent.retired}
        />
      </View>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-text-secondary">Soul</Text>
        <Input
          value={soul}
          onChangeText={setSoul}
          placeholder="Who is this agent?"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{ minHeight: 120 }}
          editable={!agent.retired}
        />
      </View>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-text-secondary">
          Identity
        </Text>
        <Text className="text-xs text-text-muted">
          Role, expertise, or behavioral posture for this agent
        </Text>
        <Input
          value={identity}
          onChangeText={setIdentity}
          placeholder="e.g. You are a senior backend engineer who favors simple, pragmatic solutions."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 80 }}
          editable={!agent.retired}
        />
      </View>

      {saveError ? (
        <Text className="text-error text-sm">{saveError}</Text>
      ) : null}

      {!agent.retired && (
        <>
          <SaveButton
            onPress={handleSave}
            disabled={!hasChanges}
            saving={saving}
            label="Save Changes"
            size="lg"
          />

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
        message="Are you sure? This agent will no longer be able to receive messages."
        confirmLabel="Retire"
        destructive
        onConfirm={doRetire}
        onCancel={() => setShowRetireConfirm(false)}
      />

      {voicePickerOpen && (
        <VoicePicker
          currentVoice={agent.ttsVoice}
          onSelect={async (voice) => {
            setVoicePickerOpen(false);
            try {
              await mutate(UpdateAgentMutation, {
                id: id ?? "",
                input: { ttsVoice: voice },
              });
              refetch();
            } catch (err) {
              setSaveError(
                err instanceof Error ? err.message : "Failed to update voice",
              );
            }
          }}
          onClose={() => setVoicePickerOpen(false)}
        />
      )}

      {pickerOpen && (
        <AvatarPicker
          avatars={avatarsResult.data?.avatars ?? []}
          loading={avatarsResult.loading}
          onSelect={async (avatar) => {
            setPickerOpen(false);
            try {
              await mutate(UpdateAgentMutation, {
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
          onClose={() => setPickerOpen(false)}
        />
      )}
    </ScrollView>
  );
}
