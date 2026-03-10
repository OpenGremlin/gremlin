import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/lib/AuthContext";
import { isAuthEnabled } from "../src/lib/auth";

export default function Index() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#818cf8" />
      </View>
    );
  }

  if (isAuthEnabled() && !token) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(app)/(home)" />;
}
