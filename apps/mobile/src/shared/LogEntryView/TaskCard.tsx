import { useSubscription } from "@apollo/client";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, Hourglass, RefreshCw } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { AttachmentFieldsFragment } from "../../graphql/generated/graphql";
import { TaskTrackingSubscription } from "../../graphql/queries";
import { useTheme } from "../../lib/ThemeContext";
import { AgentAvatar } from "../AgentAvatar";
import { FileCard } from "../FileCard";
import { filesFromAttachments } from "../FilePreview";
import { groupFiles } from "../groupFiles";
import { ImageCollage } from "../ImageCollage";

export interface TaskChild {
  id: string;
  title: string;
  status: string;
  agentId: string | null;
  assigneeName: string | null;
  latestComment: string | null;
  emoji?: string | null;
  attachments?: readonly AttachmentFieldsFragment[];
  children?: TaskChild[];
}

export interface TaskInfo extends TaskChild {
  parentId: string | null;
}

function statusLabel(status: string): string {
  switch (status) {
    case "CLOSED":
      return "Done";
    case "IN_PROGRESS":
      return "In progress";
    case "DONE":
      return "Review";
    default:
      return "Open";
  }
}

function SpinningRefresh({ color }: { color: string }) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <RefreshCw size={14} color={color} />
    </Animated.View>
  );
}

function StatusIcon({ status, isDark }: { status: string; isDark: boolean }) {
  switch (status) {
    case "CLOSED":
      return <Check size={14} color={isDark ? "#86efac" : "#16a34a"} />;
    case "IN_PROGRESS":
      return <SpinningRefresh color={isDark ? "#818cf8" : "#4f46e5"} />;
    default:
      return <Hourglass size={14} color={isDark ? "#6b7280" : "#9ca3af"} />;
  }
}

const TaskRow = React.memo(function TaskRow({
  task,
  isDark,
  depth = 0,
}: {
  task: TaskChild;
  isDark: boolean;
  depth?: number;
}) {
  const files = filesFromAttachments(
    (task.attachments ?? []) as AttachmentFieldsFragment[],
  );
  const groups = groupFiles(files);
  const rowIndent = { marginLeft: depth * 16 };
  const children = task.children ?? [];
  const hasChildren = children.length > 0;
  const closedCount = children.filter((c) => c.status === "CLOSED").length;
  const totalCount = children.length;

  const openPager = (index: number) => {
    const file = files[index];
    if (file)
      router.push({
        pathname: "/file/[...path]",
        params: { path: file.path.split("/"), task: task.id },
      });
  };

  return (
    <>
      <Pressable
        onPress={() => router.push(`/tasks/${task.id}`)}
        className="py-1.5 flex-row gap-2.5"
        style={rowIndent}
      >
        <View className="w-8 items-center pt-0.5">
          {task.emoji ? (
            <Text className="text-3xl leading-9">{task.emoji}</Text>
          ) : task.agentId ? (
            <AgentAvatar id={task.agentId} size={32} />
          ) : (
            <View className="w-8 h-8" />
          )}
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-1.5">
            <Text
              className={`text-sm shrink ${depth === 0 ? "font-medium" : ""} ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <StatusIcon status={task.status} isDark={isDark} />
            {hasChildren ? (
              <Text
                className={`text-xs font-medium ml-auto ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
              >
                {closedCount}/{totalCount}
              </Text>
            ) : null}
          </View>
          {(() => {
            const subtitle = `${statusLabel(task.status)}${task.assigneeName ? ` · @${task.assigneeName}` : ""}${task.latestComment ? ` · ${task.latestComment}` : ""}`;
            return (
              <Animated.Text
                key={subtitle}
                entering={FadeIn.duration(250)}
                className={`text-xs mt-0.5 ${isDark ? "text-indigo-300" : "text-indigo-500/60"}`}
                numberOfLines={1}
              >
                {subtitle}
              </Animated.Text>
            );
          })()}
        </View>
      </Pressable>
      {groups.length > 0 ? (
        <View className="mb-1 flex-row gap-2.5" style={rowIndent}>
          <View className="w-8" />
          <View className="flex-1 min-w-0 gap-1">
            {groups.map((group) => {
              if (group.kind === "images") {
                return (
                  <ImageCollage
                    key={`images-${group.indices[0]}`}
                    images={group.files}
                    onPressImage={(i) => openPager(group.indices[i])}
                  />
                );
              }
              return (
                <FileCard
                  key={`${group.file.path}-${group.index}`}
                  file={group.file}
                  onPress={() => openPager(group.index)}
                />
              );
            })}
          </View>
        </View>
      ) : null}
      {children.map((child) => (
        <TaskRow
          key={child.id}
          task={child}
          isDark={isDark}
          depth={depth + 1}
        />
      ))}
    </>
  );
});

// biome-ignore lint/suspicious/noExplicitAny: subscription child type varies by query depth
export function mapChild(c: any): TaskChild {
  return {
    id: c.id,
    title: c.title,
    status: c.status as string,
    agentId: c.agent?.id ?? null,
    assigneeName: c.assigneeName ?? null,
    latestComment: c.latestComment ?? null,
    emoji: c.emoji ?? null,
    attachments: c.attachments,
    children: c.children?.map((gc: any) => mapChild(gc)),
  };
}

export function TaskCard({ task }: { task: TaskInfo | null }) {
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
        emoji: u.emoji ?? null,
        attachments: u.attachments,
        children: (u.children ?? []).map((c) => mapChild(c)),
      });
    },
  });

  const resolved = liveTask ?? task;

  const gradientColors: [string, string, string] = isDark
    ? ["#080a1c", "#190837", "#280830"]
    : ["#eef2ff", "#e8e0f7", "#f0e8f5"];

  return (
    <View className="py-2 max-w-[85%]">
      <Pressable
        onPress={() => resolved && router.push(`/tasks/${resolved.id}`)}
        className={`rounded-xl overflow-hidden ${isDark ? "border border-indigo-500/20" : "border border-indigo-300"}`}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="px-3 py-1">
            {resolved ? (
              <TaskRow task={resolved} isDark={isDark} depth={0} />
            ) : (
              <View className="py-1.5 flex-row gap-2.5">
                <View className="w-8 h-8" />
                <Text
                  className={`text-sm font-medium ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
                >
                  Loading...
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
