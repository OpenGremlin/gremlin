import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import {
  ProfileQuery,
  UpdateProfileMutation,
} from "../../../src/graphql/queries";
import { execute } from "../../../src/lib/apolloClient";
import { Button } from "../../../src/shared/Button";
import { Input } from "../../../src/shared/Input";
import { QueryResult } from "../../../src/shared/QueryResult";
import { SavedIndicator } from "../../../src/shared/SavedIndicator";
import { TimezonePicker } from "../../../src/shared/TimezonePicker";

interface ProfileFormValues {
  displayName: string;
  about: string;
  website: string;
  timezone: string;
}

export default function ProfileScreen() {
  const { data, loading, error } = useQuery(ProfileQuery);
  const [saved, setSaved] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      displayName: "",
      about: "",
      website: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const profile = data?.profile;

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        about: profile.about,
        website: profile.website ?? "",
        timezone:
          profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: ProfileFormValues) {
    await execute(UpdateProfileMutation, {
      input: {
        displayName: values.displayName,
        about: values.about,
        website: values.website || null,
        timezone: values.timezone || null,
      },
    });
    reset(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || error) {
    return <QueryResult loading={loading} error={error} />;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-1">
        <Text className="text-xs text-text-muted">Display Name</Text>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, value } }) => (
            <Input value={value} onChangeText={onChange} />
          )}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-text-muted">About</Text>
        <Controller
          control={control}
          name="about"
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />
          )}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-text-muted">Website</Text>
        <Controller
          control={control}
          name="website"
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              placeholder="https://"
              autoCapitalize="none"
              keyboardType="url"
            />
          )}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-text-muted">Timezone</Text>
        <Controller
          control={control}
          name="timezone"
          render={({ field: { onChange, value } }) => (
            <TimezonePicker
              value={value}
              onChange={onChange}
              className="bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm leading-[18px] text-text-primary"
            />
          )}
        />
      </View>

      <Button
        onPress={handleSubmit(onSubmit)}
        disabled={!isDirty}
        loading={isSubmitting}
        size="lg"
      >
        Save
      </Button>
      {saved && <SavedIndicator />}
    </ScrollView>
  );
}
