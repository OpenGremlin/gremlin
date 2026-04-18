import { router } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  CreateWebhookMutation,
  WebhooksQuery,
} from "../../../../src/graphql/queries";
import { apolloClient } from "../../../../src/lib/apolloClient";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { Button } from "../../../../src/shared/Button";
import { Card } from "../../../../src/shared/Card";
import { ErrorBanner } from "../../../../src/shared/ErrorBanner";
import { Input } from "../../../../src/shared/Input";
import { TabScrollView } from "../../../../src/shared/TabScrollView";

export default function NewWebhookScreen() {
  const colors = useNavigationTheme();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setScope(i: number, value: string) {
    setScopes((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  }
  function addScope() {
    setScopes((prev) => [...prev, ""]);
  }
  function removeScope(i: number) {
    setScopes((prev) => prev.filter((_, idx) => idx !== i));
  }

  const cleanScopes = scopes.map((s) => s.trim()).filter(Boolean);
  const canSubmit = name.trim().length > 0 && cleanScopes.length > 0;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await apolloClient.mutate({
        mutation: CreateWebhookMutation,
        variables: { name: name.trim(), scopes: cleanScopes },
        refetchQueries: [{ query: WebhooksQuery }],
      });
      const created = data?.createWebhook;
      if (!created) throw new Error("No data returned");
      router.replace({
        pathname: "/settings/webhooks/[id]",
        params: {
          id: created.webhook.id,
          newKey: created.key,
          newKeyId: created.keyId,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create webhook");
      setSubmitting(false);
    }
  }

  return (
    <TabScrollView
      contentContainerClassName="px-4 pt-6 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      <ErrorBanner message={error} />

      <View className="gap-2">
        <Text className="text-base font-medium text-text-secondary">Name</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="e.g. Gmail watcher"
          autoCapitalize="none"
        />
        <Text className="text-sm text-text-muted">
          A label for you. Services don't see this.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-base font-medium text-text-secondary">
          Topics
        </Text>
        <Card className="p-3 gap-2">
          {scopes.map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable enough for inputs that come and go
            <View key={i} className="flex-row items-center gap-2">
              <Input
                value={s}
                onChangeText={(t) => setScope(i, t)}
                placeholder="gmail:* or serverhealth"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1"
              />
              {scopes.length > 1 && (
                <Pressable
                  onPress={() => removeScope(i)}
                  className="p-2 active:opacity-50"
                  hitSlop={8}
                >
                  <X size={16} color={colors.iconMuted} />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable
            onPress={addScope}
            className="flex-row items-center gap-1.5 self-start px-2 py-1 active:opacity-50"
          >
            <Plus size={16} color={colors.accent} />
            <Text className="text-base text-accent font-medium">Add topic</Text>
          </Pressable>
        </Card>
        <Text className="text-sm text-text-muted">
          Use an exact topic like{" "}
          <Text className="font-mono">gmail:marvinli@gmail.com</Text>, or a
          wildcard like <Text className="font-mono">gmail:*</Text>.
        </Text>
      </View>

      <Button
        onPress={submit}
        loading={submitting}
        loadingText="Creating..."
        disabled={!canSubmit}
        size="lg"
      >
        Create webhook
      </Button>
    </TabScrollView>
  );
}
