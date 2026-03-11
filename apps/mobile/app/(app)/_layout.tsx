import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Bot, Calendar, Home, Settings } from "lucide-react-native";
import { useAuth } from "../../src/lib/AuthContext";
import { isAuthEnabled } from "../../src/lib/auth";

export default function AppLayout() {
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // @ts-expect-error — href is an Expo Router extension not in BottomTabNavigationOptions
        href: null,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#262626",
        },
        tabBarActiveTintColor: "#818cf8",
        tabBarInactiveTintColor: "#737373",
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          href: "/home",
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          href: "/agents",
          title: "Agents",
          tabBarIcon: ({ color, size }) => <Bot size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          href: "/jobs",
          title: "Jobs",
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: "/settings",
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
