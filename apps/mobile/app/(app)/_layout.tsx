import { Redirect, Tabs } from "expo-router";
import { Bot, Calendar, Home, Settings } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/AuthContext";
import { isAuthEnabled } from "../../src/lib/auth";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";

export default function AppLayout() {
  const { token, loading } = useAuth();
  const colors = useNavigationTheme();
  const insets = useSafeAreaInsets();

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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // @ts-expect-error — href is an Expo Router extension not in BottomTabNavigationOptions
        href: null,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 64 + Math.max(insets.bottom, 0),
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
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
