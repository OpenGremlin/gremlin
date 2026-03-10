import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../src/lib/AuthContext";
import {
  cognitoConfirmSignup,
  cognitoLogin,
  cognitoSignup,
} from "../src/lib/auth";

type Mode = "login" | "signup" | "confirm";

export default function LoginScreen() {
  const { login, signupDisabled } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { idToken } = await cognitoLogin(email, password);
      await login(idToken);
      router.replace("/(app)/(home)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const { userConfirmed } = await cognitoSignup(email, password);
      if (userConfirmed) {
        const { idToken } = await cognitoLogin(email, password);
        await login(idToken);
        router.replace("/(app)/(home)");
      } else {
        setMode("confirm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      await cognitoConfirmSignup(email, code);
      const { idToken } = await cognitoLogin(email, password);
      await login(idToken);
      router.replace("/(app)/(home)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-100 text-base";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-neutral-950"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-neutral-100 text-center mb-8">
          {mode === "login"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : "Verify email"}
        </Text>

        <View className="gap-3">
          {mode === "confirm" ? (
            <TextInput
              className={inputClass}
              placeholder="Verification code"
              placeholderTextColor="#737373"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
          ) : (
            <>
              <TextInput
                className={inputClass}
                placeholder="Email"
                placeholderTextColor="#737373"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TextInput
                className={inputClass}
                placeholder="Password"
                placeholderTextColor="#737373"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </>
          )}

          {error ? (
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          ) : null}

          <Pressable
            onPress={
              mode === "login"
                ? handleLogin
                : mode === "signup"
                  ? handleSignup
                  : handleConfirm
            }
            disabled={loading}
            className="bg-indigo-600 rounded-lg py-3 items-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Verify"}
              </Text>
            )}
          </Pressable>

          {mode === "login" && !signupDisabled && (
            <Pressable onPress={() => setMode("signup")} className="py-2">
              <Text className="text-indigo-400 text-sm text-center">
                Don't have an account? Sign up
              </Text>
            </Pressable>
          )}

          {mode === "signup" && (
            <Pressable onPress={() => setMode("login")} className="py-2">
              <Text className="text-indigo-400 text-sm text-center">
                Already have an account? Sign in
              </Text>
            </Pressable>
          )}

          {mode === "confirm" && (
            <Pressable onPress={() => setMode("login")} className="py-2">
              <Text className="text-neutral-400 text-sm text-center">
                Back to sign in
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
