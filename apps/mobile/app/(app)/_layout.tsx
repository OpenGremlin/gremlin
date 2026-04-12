import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs } from "expo-router";
import { Bot, Calendar, FolderOpen, Home, Settings } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/AuthContext";
import { isAuthEnabled } from "../../src/lib/auth";
import {
  PendingCountProvider,
  usePendingCount,
} from "../../src/lib/PendingCountContext";
import { useTheme } from "../../src/lib/ThemeContext";
import { useNavigationTheme } from "../../src/lib/useNavigationTheme";
import { DelayedSpinner } from "../../src/shared/DelayedSpinner";

export default function AppLayout() {
  const { token, loading } = useAuth();
  const colors = useNavigationTheme();

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <DelayedSpinner />
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
  const { isDark } = useTheme();
  const isWeb = process.env.EXPO_OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // @ts-expect-error — href is an Expo Router extension not in BottomTabNavigationOptions
        href: null,
        tabBarStyle: {
          position: isWeb ? undefined : "absolute",
          backgroundColor: isWeb ? colors.background : "transparent",
          borderTopWidth: isWeb ? StyleSheet.hairlineWidth : 0,
          borderTopColor: colors.tabBarBorder,
          elevation: 0,
          shadowColor: "transparent",
          // Extra top padding on native reserves a breathing zone above the
          // icons for the blur to fade out through. Bottom padding is trimmed
          // below the raw safe-area inset so icons sit closer to the home
          // indicator instead of floating high in the bar. Keep in sync with
          // tabBarHeight in ChatScreen.
          paddingTop: isWeb ? 6 : 28,
          paddingBottom: isWeb ? 6 : Math.max(insets.bottom - 14, 8),
          paddingHorizontal: 20,
          height:
            (isWeb ? 56 : 78) + (isWeb ? 0 : Math.max(insets.bottom - 14, 0)),
          ...(isWeb ? { boxShadow: "none" } : {}),
        },
        tabBarBackground: isWeb
          ? undefined
          : () => (
              <MaskedView
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
                maskElement={
                  <LinearGradient
                    colors={["transparent", "black", "black"]}
                    locations={[0, 0.3, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                }
              >
                <BlurView
                  tint={
                    isDark
                      ? "systemChromeMaterialDark"
                      : "systemChromeMaterialLight"
                  }
                  intensity={90}
                  style={StyleSheet.absoluteFill}
                />
              </MaskedView>
            ),
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
        name="files"
        options={{
          href: "/files",
          title: "Files",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <FolderOpen size={22} color={color} />
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
