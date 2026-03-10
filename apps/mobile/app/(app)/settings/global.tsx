import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  GlobalSettingsQuery,
  UpdateGlobalSettingsMutation,
} from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { gql } from "../../../src/lib/auth";
import { QueryResult } from "../../../src/shared/QueryResult";
import { SavedIndicator } from "../../../src/shared/SavedIndicator";
import { Toggle } from "../../../src/shared/Toggle";

export default function GlobalSettingsScreen() {
  const { data, loading, error, refetch } = useQuery(GlobalSettingsQuery);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  const settings = data?.globalSettings;

  async function toggleSignupDisabled() {
    setSaving(true);
    try {
      await gql(UpdateGlobalSettingsMutation, {
        signupDisabled: !settings?.signupDisabled,
      });
      refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 gap-6">
      <View>
        <Text className="text-lg font-semibold text-neutral-100">Settings</Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Global settings for your Gremlin instance.
        </Text>
      </View>

      <View className="flex-row items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-medium text-neutral-100">
            Disable signup
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-500">
            Prevent new users from creating accounts. Existing users are not
            affected.
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          {saved && <SavedIndicator />}
          <Toggle
            enabled={!!settings?.signupDisabled}
            disabled={saving}
            onChange={toggleSignupDisabled}
          />
        </View>
      </View>
    </ScrollView>
  );
}
