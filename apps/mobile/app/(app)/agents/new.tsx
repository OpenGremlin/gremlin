import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { CreateAgentMutation } from "../../../src/graphql/queries";
import { mutate } from "../../../src/lib/apolloClient";
import { Button } from "../../../src/shared/Button";
import { Input } from "../../../src/shared/Input";

export default function NewAgentScreen() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [soul, setSoul] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!id.trim() || !name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const result = await mutate(CreateAgentMutation, {
        input: { id: id.trim(), name: name.trim(), soul: soul.trim() },
      });
      router.replace(`/agents/${result.createAgent.id}/config`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">ID</Text>
        <Input
          value={id}
          onChangeText={setId}
          placeholder="e.g. bob, research-agent"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">Name</Text>
        <Input value={name} onChangeText={setName} placeholder="Agent name" />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-text-secondary">Soul</Text>
        <Input
          value={soul}
          onChangeText={setSoul}
          placeholder="Who is this agent? What should they do?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
        />
      </View>

      {error ? <Text className="text-error text-sm">{error}</Text> : null}

      <Button
        onPress={handleCreate}
        disabled={!id.trim() || !name.trim()}
        loading={creating}
        size="lg"
      >
        Create Agent
      </Button>
    </ScrollView>
  );
}
