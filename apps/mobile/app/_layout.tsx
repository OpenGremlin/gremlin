import "../global.css";
import { ApolloProvider } from "@apollo/client";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/lib/AuthContext";
import { apolloClient, initApollo } from "../src/lib/apolloClient";
import { ServerConfigProvider } from "../src/lib/ServerConfigContext";
import { ThemeProvider, useTheme } from "../src/lib/ThemeContext";
import { VoiceModeProvider } from "../src/lib/VoiceModeContext";
import { NetworkBanner } from "../src/shared/NetworkBanner";

function StatusBarThemed() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function ApolloGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initApollo().then(() => setReady(true));
  }, []);
  if (!ready) return null;
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ServerConfigProvider>
          <ApolloGate>
            <AuthProvider>
              <VoiceModeProvider>
                <StatusBarThemed />
                <View style={{ flex: 1 }}>
                  <Slot />
                  <NetworkBanner />
                </View>
              </VoiceModeProvider>
            </AuthProvider>
          </ApolloGate>
        </ServerConfigProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
