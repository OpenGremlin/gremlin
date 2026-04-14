import { useSubscription } from "@apollo/client";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, ExternalLink, Hourglass, RefreshCw } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { AttachmentFieldsFragment } from "../../graphql/generated/graphql";
import { TaskTrackingSubscription } from "../../graphql/queries";
import { useTheme } from "../../lib/ThemeContext";
import { AgentAvatar } from "../AgentAvatar";
import { FileCard } from "../FileCard";
import { filesFromAttachments } from "../FilePreview";

export interface TaskChild {
  id: string;
  title: string;
  status: string;
  agentId: string | null;
  assigneeName: string | null;
  latestComment: string | null;
  attachments?: readonly AttachmentFieldsFragment[];
}

export interface TaskInfo {
  id: string;
  title: string;
  status: string;
  agentId: string | null;
  assigneeName: string | null;
  parentId: string | null;
  latestComment: string | null;
  emoji?: string | null;
  children: TaskChild[];
  attachments?: readonly AttachmentFieldsFragment[];
}

function statusLabel(status: string): string {
  switch (status) {
    case "CLOSED":
      return "Done";
    case "IN_PROGRESS":
      return "In progress";
    case "BLOCKED":
      return "Blocked";
    default:
      return "Open";
  }
}

function StatusIcon({ status, isDark }: { status: string; isDark: boolean }) {
  switch (status) {
    case "CLOSED":
      return <Check size={14} color={isDark ? "#86efac" : "#16a34a"} />;
    case "IN_PROGRESS":
      return <RefreshCw size={14} color={isDark ? "#818cf8" : "#4f46e5"} />;
    default:
      return <Hourglass size={14} color={isDark ? "#6b7280" : "#9ca3af"} />;
  }
}

function ChildRow({
  child,
  isDark,
}: {
  child: TaskChild;
  isDark: boolean;
}) {
  const files = filesFromAttachments(
    (child.attachments ?? []) as AttachmentFieldsFragment[],
  );

  return (
    <Pressable
      onPress={() => router.push(`/tasks/${child.id}`)}
      className="py-1.5"
    >
      <View className="flex-row items-center gap-2">
        {child.agentId ? (
          <AgentAvatar id={child.agentId} size={28} />
        ) : (
          <View className="w-7 h-7" />
        )}
        <View className="flex-row items-center gap-1.5 flex-1 min-w-0">
          <Text
            className={`text-sm shrink ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
            numberOfLines={1}
          >
            {child.title}
          </Text>
          <StatusIcon status={child.status} isDark={isDark} />
        </View>
      </View>
      <View className="ml-9">
        <Text
          className={`text-xs ${isDark ? "text-indigo-300" : "text-indigo-500/60"}`}
          numberOfLines={1}
        >
          {statusLabel(child.status)}
          {child.latestComment ? ` · ${child.latestComment}` : ""}
        </Text>
        {files.length > 0 && (
          <View className="mt-1 gap-1">
            {files.map((file) => (
              <FileCard key={file.path} file={file} />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function TaskCard({
  task,
}: {
  task: TaskInfo | null;
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
        emoji: u.emoji ?? null,
        attachments: u.attachments,
        children: (u.children ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status as string,
          agentId: c.agent?.id ?? null,
          assigneeName: c.assigneeName ?? null,
          latestComment: c.latestComment ?? null,
          attachments: c.attachments,
        })),
      });
    },
  });

  const resolved = liveTask ?? task;

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
        onPress={() => resolved && router.push(`/tasks/${resolved.id}`)}
        className={`rounded-xl overflow-hidden ${isDark ? "border border-indigo-500/20" : "border border-indigo-300"}`}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="px-3 py-2.5">
            {/* Header: {emoji} {title} {status} */}
            <View className="flex-row items-center gap-2">
              {resolved?.emoji ? (
                <Text className="text-2xl leading-7">{resolved.emoji}</Text>
              ) : null}
              <View className="flex-row items-center gap-1.5 flex-1 min-w-0">
                <Text
                  className={`text-sm font-medium shrink ${isDark ? "text-indigo-100" : "text-indigo-900"}`}
                  numberOfLines={1}
                >
                  {resolved?.title ?? "Loading..."}
                </Text>
                <StatusIcon
                  status={resolved?.status ?? "OPEN"}
                  isDark={isDark}
                />
                {hasChildren ? (
                  <Text
                    className={`text-xs font-medium ml-auto ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                  >
                    {closedCount}/{totalCount}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Update line */}
            {resolved && (
              <Text
                className={`text-xs mt-0.5 ${isDark ? "text-indigo-300" : "text-indigo-500/60"} ${resolved.emoji ? "ml-9" : ""}`}
                numberOfLines={1}
              >
                {statusLabel(resolved.status)}
                {resolved.assigneeName
                  ? ` · @${resolved.assigneeName}`
                  : ""}
                {resolved.latestComment
                  ? ` · ${resolved.latestComment}`
                  : ""}
              </Text>
            )}

            {/* Children */}
            {resolved && hasChildren && (
              <View className={`mt-2 ${resolved.emoji ? "ml-9" : ""}`}>
                {resolved.children.map((child) => (
                  <ChildRow key={child.id} child={child} isDark={isDark} />
                ))}
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
