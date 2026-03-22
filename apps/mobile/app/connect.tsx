import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { decodeQrPayload, fetchServerConfig } from "../src/lib/connectUtils";
import { useServerConfig } from "../src/lib/ServerConfigContext";
import { Input } from "../src/shared/Input";

const gremlinLogo = require("../../../branding/gremlin_logo.svg");

type Step = "scan" | "confirm" | "manual";

export default function ConnectScreen() {
  const { setConfig } = useServerConfig();
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<Step>("scan");
  const [serverUrl, setServerUrl] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleConnect = useCallback(
    async (url: string) => {
      setError("");
      setLoading(true);
      try {
        if (!__DEV__ && !url.startsWith("https://")) {
          throw new Error("Server URL must use HTTPS");
        }
        const cfg = await fetchServerConfig(url);
        await setConfig(cfg);
        router.replace("/login");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        setLoading(false);
      }
    },
    [setConfig],
  );

  const handleBarCodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanned) return;
      const decoded = decodeQrPayload(result.data);
      if (!decoded) {
        setError("Not a valid Gremlin QR code");
        return;
      }
      setScanned(true);
      setServerUrl(decoded);
      setStep("confirm");
    },
    [scanned],
  );

  const handleManualConnect = () => {
    const url = manualUrl.trim().replace(/\/$/, "");
    if (!url) return;
    setServerUrl(url);
    handleConnect(url);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg"
    >
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <Image
            source={gremlinLogo}
            style={{ width: 140, height: 140 }}
            contentFit="contain"
          />
          <Text className="text-3xl font-bold text-text-primary mt-2">
            OpenGremlin
          </Text>
          <Text className="text-sm text-text-muted mt-1">
            {step === "scan"
              ? "Scan the QR code from your web dashboard"
              : step === "confirm"
                ? "Connect to this server?"
                : "Enter your server URL"}
          </Text>
        </View>

        {step === "scan" && (
          <View className="gap-4">
            {!permission?.granted ? (
              <View className="gap-3">
                <Text className="text-text-muted text-sm text-center">
                  Camera access is needed to scan the QR code
                </Text>
                <Pressable
                  onPress={requestPermission}
                  className="bg-accent rounded-xl py-3.5 items-center"
                >
                  <Text className="text-white font-semibold text-base">
                    Allow Camera
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="items-center gap-4">
                <View className="w-64 h-64 rounded-2xl overflow-hidden border-2 border-accent">
                  <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    barcodeScannerSettings={{
                      barcodeTypes: ["qr"],
                    }}
                    onBarcodeScanned={
                      scanned ? undefined : handleBarCodeScanned
                    }
                  />
                </View>
              </View>
            )}

            {error ? (
              <Text className="text-error text-sm text-center">{error}</Text>
            ) : null}

            <Pressable onPress={() => setStep("manual")} className="py-2">
              <Text className="text-accent text-sm text-center">
                Enter URL manually instead
              </Text>
            </Pressable>
          </View>
        )}

        {step === "confirm" && (
          <View className="gap-3">
            <View className="rounded-xl border border-app-border bg-surface p-4">
              <Text className="text-xs text-text-muted mb-1">Server URL</Text>
              <Text
                className="text-base text-text-primary font-mono"
                numberOfLines={2}
              >
                {serverUrl}
              </Text>
            </View>

            {error ? (
              <Text className="text-error text-sm text-center">{error}</Text>
            ) : null}

            <Pressable
              onPress={() => handleConnect(serverUrl)}
              disabled={loading}
              className="bg-accent rounded-xl py-3.5 items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Connect
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setScanned(false);
                setError("");
                setStep("scan");
              }}
              className="py-2"
            >
              <Text className="text-accent text-sm text-center">
                Scan again
              </Text>
            </Pressable>
          </View>
        )}

        {step === "manual" && (
          <View className="gap-3">
            <Input
              size="lg"
              placeholder="https://your-server.cloudfront.net"
              value={manualUrl}
              onChangeText={setManualUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleManualConnect}
            />

            {error ? (
              <Text className="text-error text-sm text-center">{error}</Text>
            ) : null}

            <Pressable
              onPress={handleManualConnect}
              disabled={loading}
              className="bg-accent rounded-xl py-3.5 items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Connect
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setError("");
                setStep("scan");
              }}
              className="py-2"
            >
              <Text className="text-accent text-sm text-center">
                Back to scanner
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
