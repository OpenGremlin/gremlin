import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ProfileQuery,
  UpdateProfileMutation,
} from "../../../src/graphql/queries";
import { useQuery } from "../../../src/hooks/useQuery";
import { gql } from "../../../src/lib/auth";
import { QueryResult } from "../../../src/shared/QueryResult";
import { SavedIndicator } from "../../../src/shared/SavedIndicator";

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
    await gql(UpdateProfileMutation, {
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

  const inputClass =
    "bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-100";

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-1">
        <Text className="text-xs text-neutral-500">Display Name</Text>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className={inputClass}
              value={value}
              onChangeText={onChange}
              placeholderTextColor="#525252"
            />
          )}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-neutral-500">About</Text>
        <Controller
          control={control}
          name="about"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className={inputClass}
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
              placeholderTextColor="#525252"
            />
          )}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-neutral-500">Website</Text>
        <Controller
          control={control}
          name="website"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className={inputClass}
              value={value}
              onChangeText={onChange}
              placeholder="https://"
              placeholderTextColor="#525252"
              autoCapitalize="none"
              keyboardType="url"
            />
          )}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-neutral-500">Timezone</Text>
        <Controller
          control={control}
          name="timezone"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className={inputClass}
              value={value}
              onChangeText={onChange}
              placeholderTextColor="#525252"
              autoCapitalize="none"
            />
          )}
        />
      </View>

      <View className="flex-row items-center gap-3">
        {isDirty && (
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-indigo-600 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-sm font-medium text-white">Save</Text>
            )}
          </Pressable>
        )}
        {saved && <SavedIndicator />}
      </View>
    </ScrollView>
  );
}
