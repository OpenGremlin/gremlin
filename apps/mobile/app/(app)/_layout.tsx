import { BlurView } from "expo-blur";
import { Redirect, Tabs } from "expo-router";
import { Bot, Calendar, Home, Settings } from "lucide-react-native";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/AuthContext";
import { isAuthEnabled } from "../../src/lib/auth";
import { useTheme } from "../../src/lib/ThemeContext";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";

export default function AppLayout() {
  const { token, loading } = useAuth();
  const colors = useNavigationTheme();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS === "ios" || Platform.OS === "android";

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

  const tabBarHeight = 56 + Math.max(insets.bottom, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // @ts-expect-error — href is an Expo Router extension not in BottomTabNavigationOptions
        href: null,
        tabBarStyle: {
          position: isNative ? "absolute" : ("relative" as "absolute"),
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isNative ? "transparent" : colors.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: "transparent",
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          height: tabBarHeight,
          ...(Platform.OS === "web" ? { boxShadow: "none" } : {}),
        },
        tabBarBackground: isNative
          ? () => (
              <BlurView
                intensity={80}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            )
          : undefined,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          href: "/home",
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Home size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          href: "/agents",
          title: "Agents",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Bot size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          href: "/jobs",
          title: "Jobs",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Calendar size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: "/settings",
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Settings size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      className={`w-12 h-9 items-center justify-center rounded-2xl ${
        focused ? "bg-accent-surface" : ""
      }`}
    >
      {children}
    </View>
  );
}
