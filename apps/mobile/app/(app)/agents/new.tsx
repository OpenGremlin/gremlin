import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { CreateAgentMutation } from "../../../src/graphql/queries";
import { execute } from "../../../src/lib/apolloClient";
import { Button } from "../../../src/shared/Button";
import { Input } from "../../../src/shared/Input";
import { TabScrollView } from "../../../src/shared/TabScrollView";

export default function NewAgentScreen() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!id.trim() || !name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const result = await execute(CreateAgentMutation, {
        input: { id: id.trim(), name: name.trim() },
      });
      router.replace(`/agents/${result.createAgent.id}/config`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  return (
    <TabScrollView
      contentContainerClassName="px-4 pt-6 gap-4"
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

      {error ? <Text className="text-error text-sm">{error}</Text> : null}

      <Button
        onPress={handleCreate}
        disabled={!id.trim() || !name.trim()}
        loading={creating}
        size="lg"
      >
        Create Agent
      </Button>
    </TabScrollView>
  );
}
