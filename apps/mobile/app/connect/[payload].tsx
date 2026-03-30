import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { fetchServerConfig } from "../../src/lib/connectUtils";
import { useServerConfig } from "../../src/lib/ServerConfigContext";

const gremlinLogo = require("../../assets/gremlin_logo_wings.svg");

export default function ConnectPayloadScreen() {
  const { payload } = useLocalSearchParams<{ payload: string }>();
  const { setConfig } = useServerConfig();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrl] = useState("");

  useEffect(() => {
    if (!payload) return;
    try {
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const url = atob(base64);
      setServerUrl(url);

      (async () => {
        try {
          if (!__DEV__ && !url.startsWith("https://")) {
            throw new Error("Server URL must use HTTPS");
          }
          const cfg = await fetchServerConfig(url);
          await setConfig(cfg);
          router.replace("/");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Connection failed");
          setLoading(false);
        }
      })();
    } catch {
      setError("Invalid connect link");
      setLoading(false);
    }
  }, [payload, setConfig]);

  return (
    <View className="flex-1 bg-bg justify-center px-6">
      <View className="items-center mb-8">
        <Image
          source={gremlinLogo}
          style={{ width: 140, height: 140 }}
          contentFit="contain"
        />
        <Text className="text-3xl font-bold text-text-primary mt-2">
          OpenGremlin
        </Text>
      </View>

      {loading && !error ? (
        <View className="items-center gap-3">
          <ActivityIndicator size="large" />
          <Text className="text-text-muted text-sm">
            Connecting to {serverUrl}...
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-error text-sm text-center">{error}</Text>
          <Pressable
            onPress={() => router.replace("/connect")}
            className="bg-accent rounded-xl py-3.5 items-center"
          >
            <Text className="text-white font-semibold text-base">
              Try Again
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
