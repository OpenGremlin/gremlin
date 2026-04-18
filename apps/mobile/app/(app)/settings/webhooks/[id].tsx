import { useQuery } from "@apollo/client";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  Check,
  Copy,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AddWebhookKeyMutation,
  RevokeWebhookKeyMutation,
  RevokeWebhookMutation,
  UpdateWebhookScopesMutation,
  WebhookQuery,
} from "../../../../src/graphql/queries";
import { execute } from "../../../../src/lib/apolloClient";
import { useNavigationTheme } from "../../../../src/lib/useNavigationTheme";
import { Card } from "../../../../src/shared/Card";
import { ConfirmDialog } from "../../../../src/shared/ConfirmDialog";
import { DestructiveButton } from "../../../../src/shared/DestructiveButton";
import { ErrorBanner } from "../../../../src/shared/ErrorBanner";
import { formatTime } from "../../../../src/shared/formatDate";
import { Input } from "../../../../src/shared/Input";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";
import { TabScrollView } from "../../../../src/shared/TabScrollView";

export default function WebhookDetailScreen() {
  const colors = useNavigationTheme();
  const { id, newKey, newKeyId } = useLocalSearchParams<{
    id: string;
    newKey?: string;
    newKeyId?: string;
  }>();

  const { data, loading, error, refetch } = useQuery(WebhookQuery, {
    variables: { id: id ?? "" },
  });

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingScopes, setEditingScopes] = useState<string[] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRevokeWebhook, setConfirmRevokeWebhook] = useState(false);
  const [confirmRevokeKeyId, setConfirmRevokeKeyId] = useState<string | null>(
    null,
  );

  // Capture the new-key params into local state then strip them from the URL so
  // the plaintext doesn't survive navigation/refresh.
  useEffect(() => {
    if (
      typeof newKey === "string" &&
      newKey.length > 0 &&
      typeof newKeyId === "string" &&
      newKeyId.length > 0
    ) {
      setRevealedKey(newKey);
      setRevealedKeyId(newKeyId);
      router.setParams({ newKey: undefined, newKeyId: undefined });
    }
  }, [newKey, newKeyId]);

  function dismissReveal() {
    setRevealedKey(null);
    setRevealedKeyId(null);
  }

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }
  const webhook = data?.webhook;
  if (!webhook) return <NotFound label="Webhook not found." />;
  const webhookId = webhook.id;

  async function copyKey(key: string) {
    await Clipboard.setStringAsync(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveScopes() {
    if (!editingScopes) return;
    const cleaned = editingScopes.map((s) => s.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setActionError("At least one topic is required.");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await execute(UpdateWebhookScopesMutation, {
        id: webhookId,
        scopes: cleaned,
      });
      await refetch();
      setEditingScopes(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to save scopes",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addKey() {
    setBusy(true);
    setActionError(null);
    try {
      const result = await execute(AddWebhookKeyMutation, {
        webhookId: webhookId,
      });
      setRevealedKey(result.addWebhookKey.key);
      setRevealedKeyId(result.addWebhookKey.keyId);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add key");
    } finally {
      setBusy(false);
    }
  }

  async function revokeKey(keyId: string) {
    setConfirmRevokeKeyId(null);
    setBusy(true);
    setActionError(null);
    try {
      await execute(RevokeWebhookKeyMutation, {
        webhookId: webhookId,
        keyId,
      });
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to revoke key",
      );
    } finally {
      setBusy(false);
    }
  }

  async function revokeWebhook() {
    setConfirmRevokeWebhook(false);
    setBusy(true);
    setActionError(null);
    try {
      await execute(RevokeWebhookMutation, { id: webhookId });
      router.back();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to revoke webhook",
      );
      setBusy(false);
    }
  }

  const activeKeys = webhook.keys.filter((k) => !k.revokedAt);
  const scopes = editingScopes ?? webhook.scopes;

  return (
    <TabScrollView contentContainerClassName="px-4 pt-6 gap-5">
      <ErrorBanner message={actionError} />

      <View>
        <Text className="text-xl font-semibold text-text-primary">
          {webhook.name}
        </Text>
        <Text className="text-sm text-text-muted mt-0.5">
          Created {formatTime(webhook.createdAt)}
          {webhook.lastEventAt
            ? ` · last used ${formatTime(webhook.lastEventAt)}`
            : ""}
        </Text>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-text-secondary">
            Topics
          </Text>
          {editingScopes ? (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setEditingScopes(null)}
                className="px-2 py-1 active:opacity-50"
              >
                <Text className="text-xs text-text-muted font-medium">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={saveScopes}
                disabled={busy}
                className="px-2 py-1 active:opacity-50"
              >
                <Text className="text-xs text-accent font-medium">Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setEditingScopes([...webhook.scopes])}
              className="px-2 py-1 active:opacity-50"
            >
              <Text className="text-xs text-accent font-medium">Edit</Text>
            </Pressable>
          )}
        </View>
        <Card className="p-3 gap-2">
          {scopes.map((s, i) =>
            editingScopes ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: editing positional inputs
              <View key={i} className="flex-row items-center gap-2">
                <Input
                  value={s}
                  onChangeText={(t) =>
                    setEditingScopes((prev) =>
                      prev ? prev.map((x, idx) => (idx === i ? t : x)) : prev,
                    )
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1"
                />
                {scopes.length > 1 && (
                  <Pressable
                    onPress={() =>
                      setEditingScopes((prev) =>
                        prev ? prev.filter((_, idx) => idx !== i) : prev,
                      )
                    }
                    className="p-2 active:opacity-50"
                    hitSlop={8}
                  >
                    <X size={16} color={colors.iconMuted} />
                  </Pressable>
                )}
              </View>
            ) : (
              <View
                key={s}
                className="self-start bg-accent-surface rounded-md px-2.5 py-1.5"
              >
                <Text className="text-base font-mono font-bold text-accent">
                  {s}
                </Text>
              </View>
            ),
          )}
          {editingScopes && (
            <Pressable
              onPress={() =>
                setEditingScopes((prev) => (prev ? [...prev, ""] : [""]))
              }
              className="flex-row items-center gap-1.5 self-start px-2 py-1 active:opacity-50"
            >
              <Plus size={14} color={colors.accent} />
              <Text className="text-sm text-accent font-medium">Add topic</Text>
            </Pressable>
          )}
        </Card>
      </View>

      <View className="gap-2">
        <Text className="text-base font-medium text-text-secondary">
          API keys ({activeKeys.length})
        </Text>
        <Card className="overflow-hidden">
          {activeKeys.length === 0 ? (
            <View className="px-4 py-3">
              <Text className="text-sm text-text-muted">
                No active keys. Add one to authenticate this webhook.
              </Text>
            </View>
          ) : (
            activeKeys.map((k, i) => {
              const isRevealed = revealedKeyId === k.id && revealedKey;
              return (
                <View
                  key={k.id}
                  className={`gap-3 px-4 py-3 ${
                    i > 0 ? "border-t border-app-border" : ""
                  } ${isRevealed ? "bg-amber-500/5" : ""}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 min-w-0">
                      <Text className="text-base text-text-primary font-mono font-medium">
                        {k.prefix}…
                      </Text>
                      <Text className="text-xs text-text-muted mt-0.5">
                        Created {formatTime(k.createdAt)}
                        {k.lastUsedAt
                          ? ` · last used ${formatTime(k.lastUsedAt)}`
                          : " · never used"}
                      </Text>
                    </View>
                    {isRevealed ? (
                      <Pressable
                        onPress={dismissReveal}
                        hitSlop={6}
                        className="p-2 active:opacity-50"
                      >
                        <X size={14} color={colors.iconMuted} />
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => setConfirmRevokeKeyId(k.id)}
                        hitSlop={6}
                        className="p-2 active:opacity-50"
                      >
                        <Trash2 size={14} color={colors.iconMuted} />
                      </Pressable>
                    )}
                  </View>
                  {isRevealed && revealedKey && (
                    <View className="gap-2">
                      <View className="flex-row items-center gap-1.5">
                        <AlertTriangle size={14} color="#d97706" />
                        <Text className="text-xs font-semibold text-amber-700 dark:text-amber-500">
                          Save this key now — you won't see it again.
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2 bg-surface-alt rounded-lg px-3 py-2.5">
                        <Text
                          className="text-sm text-text-primary font-mono flex-1"
                          selectable
                        >
                          {revealedKey}
                        </Text>
                        <Pressable
                          onPress={() => copyKey(revealedKey)}
                          className="flex-row items-center justify-center gap-1 px-2 py-1 rounded-md bg-accent active:opacity-80 w-[82px]"
                        >
                          {copied ? (
                            <Check size={12} color="white" />
                          ) : (
                            <Copy size={12} color="white" />
                          )}
                          <Text className="text-xs text-white font-medium">
                            {copied ? "Copied" : "Copy"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
          <Pressable
            onPress={addKey}
            disabled={busy}
            className={`flex-row items-center gap-2 px-4 py-3 active:bg-surface-alt ${
              activeKeys.length > 0 ? "border-t border-app-border" : ""
            }`}
          >
            <Plus size={16} color={colors.accent} />
            <Text className="text-base text-accent font-medium">Add key</Text>
          </Pressable>
        </Card>
      </View>

      <DestructiveButton
        onPress={() => setConfirmRevokeWebhook(true)}
        loading={busy && confirmRevokeWebhook}
        label="Revoke webhook"
        loadingLabel="Revoking..."
        size="lg"
      />

      <ConfirmDialog
        visible={confirmRevokeWebhook}
        title="Revoke webhook"
        message="All keys will stop working immediately. This cannot be undone."
        confirmLabel="Revoke"
        destructive
        onConfirm={revokeWebhook}
        onCancel={() => setConfirmRevokeWebhook(false)}
      />

      <ConfirmDialog
        visible={confirmRevokeKeyId !== null}
        title="Revoke key"
        message="Any service using this key will start getting 401 errors."
        confirmLabel="Revoke"
        destructive
        onConfirm={() => confirmRevokeKeyId && revokeKey(confirmRevokeKeyId)}
        onCancel={() => setConfirmRevokeKeyId(null)}
      />
    </TabScrollView>
  );
}
