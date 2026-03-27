import "../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/lib/AuthContext";
import { ServerConfigProvider } from "../src/lib/ServerConfigContext";
import { ThemeProvider, useTheme } from "../src/lib/ThemeContext";
import { NetworkBanner } from "../src/shared/NetworkBanner";

function StatusBarThemed() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ServerConfigProvider>
          <AuthProvider>
            <StatusBarThemed />
            <View style={{ flex: 1 }}>
              <Slot />
              <NetworkBanner />
            </View>
          </AuthProvider>
        </ServerConfigProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
