import { useSubscription } from "@apollo/client";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, Circle, ExternalLink } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TaskTrackingSubscription } from "../../graphql/queries";
import { useTheme } from "../../lib/ThemeContext";

export interface TaskChild {
  id: string;
  title: string;
  status: string;
  agentId: string | null;
  assigneeName: string | null;
  latestComment: string | null;
}

export interface TaskInfo {
  id: string;
  title: string;
  status: string;
  agentId: string | null;
  assigneeName: string | null;
  parentId: string | null;
  latestComment: string | null;
  children: TaskChild[];
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

function ChildRow({
  child,
  agentId,
  isDark,
}: {
  child: TaskChild;
  agentId: string;
  isDark: boolean;
}) {
  const handlePress = () => {
    const targetAgent = child.agentId ?? agentId;
    router.push(`/agents/${targetAgent}/tasks/${child.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-start gap-2 py-1"
    >
      <View className="mt-0.5">
        <StatusIcon status={child.status} isDark={isDark} />
      </View>
      <View className="flex-1 min-w-0">
        <Text
          className={`text-sm ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
          numberOfLines={1}
        >
          {child.assigneeName ? `@${child.assigneeName} ` : ""}
          {child.title}
        </Text>
      </View>
    </Pressable>
  );
}

export function TaskCard({
  task,
  agentId,
}: {
  task: TaskInfo | null;
  agentId: string;
}) {
  const { isDark } = useTheme();

  const [liveTask, setLiveTask] = useState<TaskInfo | null>(null);
  const taskId = task?.id;
  useEffect(() => setLiveTask(null), [taskId]);

  useSubscription(TaskTrackingSubscription, {
    variables: { taskId: task?.id ?? "" },
    skip: !task,
    onData: ({ data: { data } }) => {
      if (!data?.taskUpdated) return;
      const u = data.taskUpdated;
      setLiveTask({
        id: u.id,
        title: u.title,
        status: u.status as string,
        agentId: u.agent?.id ?? null,
        assigneeName: u.assigneeName ?? null,
        parentId: u.parentId ?? null,
        latestComment: u.latestComment ?? null,
        children: (u.children ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status as string,
          agentId: c.agent?.id ?? null,
          assigneeName: c.assigneeName ?? null,
          latestComment: c.latestComment ?? null,
        })),
      });
    },
  });

  const resolved = liveTask ?? task;

  const handlePress = () => {
    if (!resolved) return;
    const targetAgent = resolved.agentId ?? agentId;
    router.push(`/agents/${targetAgent}/tasks/${resolved.id}`);
  };

  const gradientColors: [string, string, string] = isDark
    ? ["#080a1c", "#190837", "#280830"]
    : ["#eef2ff", "#e8e0f7", "#f0e8f5"];

  const hasChildren = resolved && resolved.children.length > 0;
  const closedCount =
    resolved?.children.filter((c) => c.status === "CLOSED").length ?? 0;
  const totalCount = resolved?.children.length ?? 0;

  return (
    <View className="py-2 max-w-[85%]">
      <Pressable
        onPress={handlePress}
        className={`rounded-xl overflow-hidden ${isDark ? "border border-indigo-500/20" : "border border-indigo-300"}`}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="px-3 py-2.5">
            <View className="flex-row items-center gap-1.5">
              <Text
                className={`text-sm font-medium flex-1 ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
                numberOfLines={1}
              >
                {resolved?.title ?? "Loading..."}
              </Text>
              {hasChildren ? (
                <Text
                  className={`text-xs font-medium ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                >
                  {closedCount}/{totalCount}
                </Text>
              ) : (
                <ExternalLink
                  size={12}
                  color={isDark ? "#818cf8" : "#4f46e5"}
                />
              )}
            </View>

            {resolved && !hasChildren && (
              <Text
                className="text-xs mt-0.5 text-text-muted"
                numberOfLines={1}
              >
                {resolved.status === "CLOSED"
                  ? "✓ Done"
                  : resolved.status === "IN_PROGRESS"
                    ? "◐ In progress"
                    : resolved.status === "BLOCKED"
                      ? "● Blocked"
                      : "○ Open"}
                {resolved.assigneeName ? ` · @${resolved.assigneeName}` : ""}
                {resolved.latestComment ? ` · ${resolved.latestComment}` : ""}
              </Text>
            )}

            {resolved && hasChildren && (
              <View className="mt-2">
                {resolved.children.map((child) => (
                  <ChildRow
                    key={child.id}
                    child={child}
                    agentId={agentId}
                    isDark={isDark}
                  />
                ))}
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
