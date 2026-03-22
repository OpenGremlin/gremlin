import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { cognitoChangePassword } from "../../../src/lib/auth";
import { Button } from "../../../src/shared/Button";
import { Input } from "../../../src/shared/Input";

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordScreen() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ChangePasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordForm) {
    setError(null);
    setSuccess(false);

    if (values.newPassword !== values.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (values.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    try {
      await cognitoChangePassword(values.currentPassword, values.newPassword);
      setSuccess(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password change failed");
    }
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-6 gap-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-1">
        <Text className="text-xs text-text-muted">Current Password</Text>
        <Controller
          control={control}
          name="currentPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="current-password"
            />
          )}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-text-muted">New Password</Text>
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="new-password"
            />
          )}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-text-muted">Confirm New Password</Text>
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="new-password"
            />
          )}
        />
      </View>

      {error && (
        <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
      )}

      {success && (
        <Text className="text-sm text-green-600 dark:text-green-400">
          Password changed successfully
        </Text>
      )}

      <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg">
        Change Password
      </Button>
    </ScrollView>
  );
}
