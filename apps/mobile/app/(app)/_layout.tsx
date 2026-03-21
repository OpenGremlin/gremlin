import { Redirect, Tabs } from "expo-router";
import { Bot, Calendar, Home, Settings } from "lucide-react-native";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/AuthContext";
import { isAuthEnabled } from "../../src/lib/auth";
import {
  PendingCountProvider,
  usePendingCount,
} from "../../src/lib/PendingCountContext";
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
    <PendingCountProvider>
      <AppTabs />
    </PendingCountProvider>
  );
}

function AppTabs() {
  const colors = useNavigationTheme();
  const insets = useSafeAreaInsets();
  const { pendingCount } = usePendingCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // @ts-expect-error — href is an Expo Router extension not in BottomTabNavigationOptions
        href: null,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: "transparent",
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          height: 56 + Math.max(insets.bottom, 0),
          ...(Platform.OS === "web" ? { boxShadow: "none" } : {}),
        },
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
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#ef4444",
            fontSize: 10,
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
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
