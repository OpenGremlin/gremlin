import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useAuth } from "../src/lib/AuthContext";
import {
  cognitoConfirmSignup,
  cognitoLogin,
  cognitoSignup,
} from "../src/lib/auth";
import { Input } from "../src/shared/Input";

const gremlinLogo = require("../assets/gremlin_logo_wings.svg");

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
      router.replace("/home");
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
        router.replace("/home");
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
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg"
    >
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <Image
            source={gremlinLogo}
            style={{ width: 180, height: 180 }}
            contentFit="contain"
          />
          <Text className="text-3xl font-bold text-text-primary mt-2">
            OpenGremlin
          </Text>
          <Text className="text-sm text-text-muted mt-1">
            {mode === "login"
              ? "Sign in to your account"
              : mode === "signup"
                ? "Create a new account"
                : "Check your email for a code"}
          </Text>
        </View>

        <View className="gap-3">
          {mode === "confirm" ? (
            <Input
              size="lg"
              placeholder="Verification code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
          ) : (
            <>
              <Input
                size="lg"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Input
                size="lg"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                returnKeyType="done"
                onSubmitEditing={mode === "login" ? handleLogin : handleSignup}
              />
            </>
          )}

          {error ? (
            <Text className="text-error text-sm text-center">{error}</Text>
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
            className="bg-accent rounded-xl py-3.5 items-center mt-2"
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
              <Text className="text-accent text-sm text-center">
                Don't have an account? Sign up
              </Text>
            </Pressable>
          )}

          {mode === "login" && (
            <Pressable onPress={() => router.push("/connect")} className="py-2">
              <Text className="text-text-muted text-sm text-center">
                Use a different server
              </Text>
            </Pressable>
          )}

          {mode === "signup" && (
            <Pressable onPress={() => setMode("login")} className="py-2">
              <Text className="text-accent text-sm text-center">
                Already have an account? Sign in
              </Text>
            </Pressable>
          )}

          {mode === "confirm" && (
            <Pressable onPress={() => setMode("login")} className="py-2">
              <Text className="text-text-muted text-sm text-center">
                Back to sign in
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
