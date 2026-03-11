import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/lib/AuthContext";
import { isAuthEnabled } from "../src/lib/auth";
import { useNavigationTheme } from "../src/lib/useNavigationTheme";

export default function Index() {
  const { token, loading } = useAuth();
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

  if (isAuthEnabled() && !token) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/home" />;
}
