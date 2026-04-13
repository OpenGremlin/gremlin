import { router, Stack, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, Circle, User } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { BeadChild } from "../../../../../src/hooks/useBeadInfo";
import { useBeadInfo } from "../../../../../src/hooks/useBeadInfo";
import { useTheme } from "../../../../../src/lib/ThemeContext";
import { useNavigationTheme } from "../../../../../src/lib/useNavigationTheme";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  OPEN: { label: "Open", bg: "#6b7280", text: "#ffffff" },
  IN_PROGRESS: { label: "In Progress", bg: "#6366f1", text: "#ffffff" },
  BLOCKED: { label: "Blocked", bg: "#dc2626", text: "#ffffff" },
  CLOSED: { label: "Closed", bg: "#16a34a", text: "#ffffff" },
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.OPEN;
  return (
    <View
      style={{
        backgroundColor: badge.bg,
        borderRadius: 9999,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color: badge.text, fontSize: 12, fontWeight: "600" }}>
        {badge.label}
      </Text>
    </View>
  );
}

function StatusIcon({ status, isDark }: { status: string; isDark: boolean }) {
  switch (status) {
    case "CLOSED":
      return <Check size={14} color={isDark ? "#86efac" : "#16a34a"} />;
    case "IN_PROGRESS":
      return (
        <Circle
          size={14}
          fill={isDark ? "#818cf8" : "#4f46e5"}
          color={isDark ? "#818cf8" : "#4f46e5"}
        />
      );
    default:
      return <Circle size={14} color={isDark ? "#6b7280" : "#9ca3af"} />;
  }
}

// ---------------------------------------------------------------------------
// Child row (for epics)
// ---------------------------------------------------------------------------

function ChildRow({
  child,
  agentId,
  isDark,
  colors,
}: {
  child: BeadChild;
  agentId: string;
  isDark: boolean;
  colors: ReturnType<typeof useNavigationTheme>;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/agents/${agentId}/beads/${child.id}`)}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.06)",
      }}
    >
      <View style={{ marginTop: 2 }}>
        <StatusIcon status={child.status} isDark={isDark} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 14, color: colors.headerText }}
        >
          {child.assigneeName ? `@${child.assigneeName}  ` : ""}
          {child.title}
        </Text>
        {child.latestComment ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 12, color: colors.iconMuted, marginTop: 2 }}
          >
            {child.latestComment}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useNavigationTheme>;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: colors.iconMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function BeadDetailScreen() {
  const { id: agentId, beadId } = useLocalSearchParams<{
    id: string;
    beadId: string;
  }>();

  const { isDark } = useTheme();
  const colors = useNavigationTheme();
  const bead = useBeadInfo(beadId ?? null);

  const hasChildren = bead && bead.children.length > 0;
  const closedCount =
    bead?.children.filter((c) => c.status === "CLOSED").length ?? 0;
  const totalCount = bead?.children.length ?? 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: 60,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.headerBackground,
            borderBottomWidth: 1,
            borderBottomColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.08)",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{ marginRight: 12 }}
          >
            <ArrowLeft size={22} color={colors.headerText} />
          </Pressable>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: "600",
              color: colors.headerText,
            }}
          >
            {bead?.title ?? "Bead"}
          </Text>
        </View>

        {/* Content */}
        {!bead ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          >
            {/* Status badge + assignee row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <StatusBadge status={bead.status} />
              {bead.assigneeName ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <User size={14} color={colors.iconDefault} />
                  <Text style={{ fontSize: 13, color: colors.headerText }}>
                    {bead.assigneeName}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Latest comment */}
            {bead.latestComment ? (
              <Section title="Latest Comment" colors={colors}>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.headerText,
                    lineHeight: 20,
                  }}
                >
                  {bead.latestComment}
                </Text>
              </Section>
            ) : null}

            {/* Children tree (epics) */}
            {hasChildren ? (
              <Section
                title={`Sub-tasks (${closedCount}/${totalCount} done)`}
                colors={colors}
              >
                <View
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.03)",
                  }}
                >
                  {bead.children.map((child) => (
                    <ChildRow
                      key={child.id}
                      child={child}
                      agentId={agentId ?? ""}
                      isDark={isDark}
                      colors={colors}
                    />
                  ))}
                </View>
              </Section>
            ) : null}

            {/* Metadata: parent */}
            {bead.parentId ? (
              <Section title="Parent Bead" colors={colors}>
                <Pressable
                  onPress={() =>
                    router.push(`/agents/${agentId}/beads/${bead.parentId}`)
                  }
                >
                  <Text style={{ fontSize: 14, color: colors.accent }}>
                    {bead.parentId}
                  </Text>
                </Pressable>
              </Section>
            ) : null}
          </ScrollView>
        )}
      </View>
    </>
  );
}
