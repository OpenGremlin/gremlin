import { useLocalSearchParams } from "expo-router";
import { Pencil, Volume2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AgentQuery,
  AvatarsQuery,
  RetireAgentMutation,
  UnretireAgentMutation,
  UpdateAgentMutation,
} from "../../../../src/graphql/queries";
import { useQuery } from "../../../../src/hooks/useQuery";
import { gql } from "../../../../src/lib/auth";
import { AgentAvatar } from "../../../../src/shared/AgentAvatar";
import { AvatarPicker } from "../../../../src/shared/AgentAvatar/AvatarPicker";
import { VoicePicker } from "../../../../src/shared/AgentAvatar/VoicePicker";
import { ConfirmDialog } from "../../../../src/shared/ConfirmDialog";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";
import { SaveButton } from "../../../../src/shared/SaveButton";
import { ToolsConfig } from "../../../../src/shared/ToolsConfig";

const INPUT_CLASS =
  "bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 text-sm";

export default function AgentConfigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, setData, refetch } = useQuery(AgentQuery, {
    id: id ?? "",
  });
  const agent = data?.agent;
  const avatarsResult = useQuery(AvatarsQuery);

  const [name, setName] = useState("");
  const [soul, setSoul] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [retiring, setRetiring] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);

  useEffect(() => {
    if (!agent) return;
    setName(agent.name);
    setSoul(agent.soul ?? "");
  }, [agent]);

  const handleSave = useCallback(async () => {
    if (!agent) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await gql(UpdateAgentMutation, {
        id: id ?? "",
        input: {
          name: name.trim(),
          soul: soul.trim(),
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
  }, [id, agent, name, soul, setData]);

  const [showRetireConfirm, setShowRetireConfirm] = useState(false);

  const doRetire = useCallback(async () => {
    setShowRetireConfirm(false);
    setRetiring(true);
    try {
      await gql(RetireAgentMutation, { id: id ?? "" });
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
      await gql(UnretireAgentMutation, { id: id ?? "" });
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
    name.trim() !== agent.name || soul.trim() !== (agent.soul ?? "");

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-6"
      keyboardShouldPersistTaps="handled"
    >
      {agent.retired && (
        <View className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 flex-row items-center justify-between">
          <Text className="text-sm text-neutral-400">
            This agent is retired.
          </Text>
          <Pressable
            onPress={doUnretire}
            disabled={retiring}
            className="px-3 py-1.5 bg-blue-600 rounded-lg"
          >
            {retiring ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-sm text-white font-medium">Restore</Text>
            )}
          </Pressable>
        </View>
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
            <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neutral-700 border-2 border-neutral-950 items-center justify-center">
              <Pencil size={12} color="#e5e5e5" />
            </View>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={agent.retired ? undefined : () => setVoicePickerOpen(true)}
        disabled={!!agent.retired}
        className={`self-center flex-row items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 ${agent.retired ? "opacity-50" : "active:bg-neutral-700"}`}
      >
        <Volume2 size={16} color="#a3a3a3" />
        <Text className="text-sm text-neutral-200">
          {agent.ttsVoice ?? "No voice"}
        </Text>
      </Pressable>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-neutral-300">Name</Text>
        <TextInput
          className={INPUT_CLASS}
          value={name}
          onChangeText={setName}
          placeholder="Agent name"
          placeholderTextColor="#737373"
          editable={!agent.retired}
        />
      </View>

      <View className={`gap-2 ${agent.retired ? "opacity-50" : ""}`}>
        <Text className="text-sm font-medium text-neutral-300">Soul</Text>
        <TextInput
          className={INPUT_CLASS}
          value={soul}
          onChangeText={setSoul}
          placeholder="Who is this agent?"
          placeholderTextColor="#737373"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{ minHeight: 120 }}
          editable={!agent.retired}
        />
      </View>

      {saveError ? (
        <Text className="text-red-400 text-sm">{saveError}</Text>
      ) : null}

      {!agent.retired && (
        <>
          <SaveButton
            onPress={handleSave}
            disabled={!hasChanges}
            saving={saving}
            label="Save Changes"
          />

          <ToolsConfig agent={agent} />

          <Pressable
            onPress={() => setShowRetireConfirm(true)}
            disabled={retiring}
            className="self-start rounded-lg px-5 py-3 items-center border border-red-800 mt-4"
          >
            {retiring ? (
              <ActivityIndicator color="#f87171" />
            ) : (
              <Text className="text-red-400 font-semibold">Retire Agent</Text>
            )}
          </Pressable>
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
              await gql(UpdateAgentMutation, {
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
              await gql(UpdateAgentMutation, {
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
