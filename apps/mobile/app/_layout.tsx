import "../global.css";
import { ApolloProvider } from "@apollo/client";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/lib/AuthContext";
import { apolloClient, initApollo } from "../src/lib/apolloClient";
import { LocalSettingsProvider } from "../src/lib/LocalSettingsContext";
import { ServerConfigProvider } from "../src/lib/ServerConfigContext";
import { ThemeProvider, useTheme } from "../src/lib/ThemeContext";
import { useNavigationTheme } from "../src/lib/useNavigationTheme";
import { VoiceProvider } from "../src/lib/VoiceContext";
import { NetworkBanner } from "../src/shared/NetworkBanner";
import { PickerOverlay } from "../src/shared/PickerModal";

function StatusBarThemed() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function NavigationThemed({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        background: colors.background,
        card: colors.headerBackground,
        border: colors.border,
        text: colors.headerText,
        primary: colors.accent,
      },
    }),
    [isDark, colors],
  );
  return <NavThemeProvider value={navTheme}>{children}</NavThemeProvider>;
}

// Root-level stack so global modal sheets can be presented over any tab
// without each tab's nested Stack having to register them. The (app)
// group, login, and connect screens are normal stack children; routes
// under app/sheet/* are registered as formSheet presentations so the
// OS draws the partial-height sheet, swipe-to-dismiss, and grabber.
function RootStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="tasks/[id]" />
      <Stack.Screen name="login" />
      <Stack.Screen name="connect/index" />
      <Stack.Screen name="connect/[payload]" />
      <Stack.Screen
        name="model"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="file/[...path]"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="skill/[id]"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="draw"
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

function ApolloGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initApollo().then(() => setReady(true));
  }, []);
  if (!ready) return null;
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ServerConfigProvider>
          <ApolloGate>
            <AuthProvider>
              <LocalSettingsProvider>
                <VoiceProvider>
                  <StatusBarThemed />
                  <NavigationThemed>
                    <View style={{ flex: 1 }}>
                      <RootStack />
                      <NetworkBanner />
                      <PickerOverlay />
                    </View>
                  </NavigationThemed>
                </VoiceProvider>
              </LocalSettingsProvider>
            </AuthProvider>
          </ApolloGate>
        </ServerConfigProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
