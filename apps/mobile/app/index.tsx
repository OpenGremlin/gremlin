import { Redirect } from "expo-router";
import { ActivityIndicator, Platform, View } from "react-native";
import { useAuth } from "../src/lib/AuthContext";
import { isAuthEnabled } from "../src/lib/auth";
import { useServerConfig } from "../src/lib/ServerConfigContext";
import { useNavigationTheme } from "../src/lib/useNavigationTheme";

export default function Index() {
  const { token, loading } = useAuth();
  const { config } = useServerConfig();
  const colors = useNavigationTheme();

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accentIndicator} />
      </View>
    );
  }

  // On native, redirect to connect screen if no server is configured
  if (Platform.OS !== "web" && !config) {
    return <Redirect href="/connect" />;
  }

  if (isAuthEnabled() && !token) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/home" />;
}
