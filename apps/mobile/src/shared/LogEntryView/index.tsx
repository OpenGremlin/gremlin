import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  BookOpen,
  Brain,
  Calendar,
  CircleAlert,
  Eye,
  File,
  Flag,
  KeyRound,
  Link,
  List,
  Monitor,
  PencilLine,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AgentLogRole } from "../../graphql/generated/graphql";
import type { ChatMessage } from "../../hooks/useLogMessages";
import type { CommandStream } from "../../hooks/useSandboxOutput";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { UserBubble } from "../ChatScreen/UserBubble";
import { FileCard } from "../FileCard";
import { filesFromAttachments } from "../FilePreview";
import { formatTime } from "../formatDate";
import { formatFileSize } from "../formatFileSize";
import { BackgroundTaskCard } from "./BackgroundTaskCard";
import { CommandApprovalCard } from "./CommandApprovalCard";
import { DelegateCard } from "./DelegateCard";
import { FnLabel } from "./FnLabel";
import { InputRequestCard } from "./InputRequestCard";
import { Markdown } from "./Markdown";
import { ReasoningBlock } from "./ReasoningBlock";
import {
  isKnownTool,
  resolveToolFields,
  safeParseJson,
  ToolName,
} from "./resolveToolFields";
import { ToolBlock } from "./ToolBlock";
import { ToolStatus } from "./ToolStatus";

function FileUploadCard({
  data,
}: {
  data: {
    filename?: string;
    path?: string;
    sizeBytes?: number;
    contentType?: string;
    files?: Array<{
      filename?: string;
      path?: string;
      sizeBytes?: number;
      contentType?: string;
    }>;
  };
}) {
  const files = data.files ?? [data];

  return (
    <View className="py-1 gap-1">
      {files.map((file, i) => (
        <View
          key={file.path ?? i}
          className="flex-row items-center gap-2.5 px-3 py-2 bg-surface border border-app-border rounded-lg"
        >
          <File size={16} color="#818cf8" />
          <View className="flex-1 min-w-0">
            <Text className="text-sm text-text-secondary" numberOfLines={1}>
              {file.filename ?? "Unknown file"}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              {file.sizeBytes != null && (
                <Text className="text-[10px] text-text-muted">
                  {formatFileSize(file.sizeBytes)}
                </Text>
              )}
              {file.contentType && (
                <Text className="text-[10px] text-text-muted">
                  {file.contentType}
                </Text>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Static map from ToolName → Lucide icon. The backend owns the message; the frontend owns the icon. */
const TOOL_ICON: Record<ToolName, LucideIcon> = {
  [ToolName.UpdateTaskMessage]: Flag,
  [ToolName.ReplyToAssigner]: Bell,
  [ToolName.BackgroundTask]: Flag,
  [ToolName.Delegate]: Send,
  [ToolName.RequestUserInput]: ShieldCheck,
  [ToolName.ReadFile]: Eye,
  [ToolName.WriteFile]: PencilLine,
  [ToolName.EditFile]: PencilLine,
  [ToolName.ListFiles]: List,
  [ToolName.Glob]: Search,
  [ToolName.Grep]: Search,
  [ToolName.AttachFile]: File,
  [ToolName.AttachLink]: Link,
  [ToolName.EnsureSandbox]: Monitor,
  [ToolName.RunCommand]: Monitor,
  [ToolName.ReadCommandOutput]: Monitor,
  [ToolName.ViewImage]: Eye,
  [ToolName.GenerateImage]: Sparkles,
  [ToolName.GenerateSpeech]: Sparkles,
  [ToolName.WebSearch]: Search,
  [ToolName.WebFetch]: Search,
  [ToolName.ReadSkill]: BookOpen,
  [ToolName.ReadSkillReference]: Search,
  [ToolName.Authenticate]: KeyRound,
  [ToolName.SaveMemory]: Save,
  [ToolName.RecallMemory]: Brain,
  [ToolName.ListJobs]: List,
  [ToolName.ScheduleJob]: Calendar,
  [ToolName.UpdateJob]: Calendar,
};

/**
 * Render a tool call that needs a custom widget (not just a hint + file preview).
 * Returns `undefined` if the tool should use the default hint-based rendering.
 */
function renderCustomWidget(
  toolName: ToolName,
  tool: {
    input: Record<string, unknown> | null;
    result: Record<string, unknown> | null;
  },
  message: ChatMessage,
  agentId: string,
  showTimestamp: boolean,
  colors: ReturnType<typeof useNavigationTheme>,
  sandboxStreams?: Map<string, CommandStream>,
): React.ReactNode | undefined {
  switch (toolName) {
    case ToolName.BackgroundTask:
      return (
        <BackgroundTaskCard
          agentId={agentId}
          taskId={(tool.result?.taskId as string) ?? null}
          taskTitle={(tool.input?.title as string) ?? "Untitled task"}
        />
      );

    case ToolName.Delegate:
      return (
        <DelegateCard
          targetAgentId={(tool.result?.targetAgentId as string) ?? null}
          targetName={
            (tool.result?.targetName as string) ??
            (tool.input?.targetAgentId as string) ??
            null
          }
          taskId={(tool.result?.taskId as string) ?? null}
          taskTitle={(tool.input?.title as string) ?? "Delegated task"}
          brief={(tool.input?.brief as string) ?? null}
          rejectedReason={(tool.result?.error as string) ?? null}
        />
      );

    case ToolName.RequestUserInput: {
      const inputRequestId = tool.result?.inputRequestId as string | undefined;
      const question =
        (tool.input?.message as string) ?? "Waiting for user input";
      const actions =
        (tool.input?.actions as Array<{ label: string; style: string }>) ?? [];

      if (inputRequestId && tool.result?.status === "pending") {
        return (
          <InputRequestCard
            inputRequestId={inputRequestId}
            message={question}
            actions={actions}
            createdAt={message.createdAt}
            showTimestamp={showTimestamp}
          />
        );
      }
      return undefined; // fall through to hint-based rendering
    }

    case ToolName.RunCommand: {
      const commandId = tool.result?.commandId as string | undefined;
      const command = (tool.input?.command as string | undefined) ?? "...";
      const reason = (tool.result?.reason as string | undefined) ?? "";
      const approvalId =
        (message.commandApprovalId as string | undefined) ??
        (tool.result?.commandApprovalId as string | undefined);
      const approvalStatus = tool.result?.status as string | undefined;

      if (approvalId && approvalStatus === "pending_approval") {
        return (
          <CommandApprovalCard
            commandApprovalId={approvalId}
            command={command}
            reason={reason}
            createdAt={message.createdAt}
            showTimestamp={showTimestamp}
          />
        );
      }

      const hasResult = !!tool.result;
      const output = (tool.result?.output as string) ?? "";
      const exitCode = tool.result?.exitCode as number | undefined;
      const exitSuffix =
        exitCode !== undefined && exitCode !== 0 ? ` exit ${exitCode}` : "";

      const fnLabel = <FnLabel fn="run" arg={command + exitSuffix} />;

      let stream = commandId ? sandboxStreams?.get(commandId) : undefined;
      if (!hasResult && !stream && sandboxStreams) {
        for (const [, s] of sandboxStreams) {
          if (!s.done) stream = s;
        }
      }

      if (!hasResult) {
        if (stream && (stream.output || stream.done)) {
          return (
            <ToolBlock
              label={fnLabel}
              content={stream.output || "(no output)"}
              createdAt={message.createdAt}
              showTimestamp={showTimestamp}
              streaming={!stream.done}
            >
              {!stream.done && (
                <View className="flex-row items-center gap-1.5 px-3 py-1 border-t border-border-subtle">
                  <ActivityIndicator size={10} color={colors.iconMuted} />
                  <Text className="text-[10px] text-text-muted">
                    Running...
                  </Text>
                </View>
              )}
              {stream.done &&
                stream.exitCode !== undefined &&
                stream.exitCode !== 0 && (
                  <View className="px-3 py-1 border-t border-border-subtle">
                    <Text className="text-[10px] text-error/70">
                      exit code {stream.exitCode}
                    </Text>
                  </View>
                )}
            </ToolBlock>
          );
        }

        return (
          <ToolBlock
            label={fnLabel}
            createdAt={message.createdAt}
            showTimestamp={showTimestamp}
          >
            <View className="flex-row items-center gap-2 px-3 py-2">
              <ActivityIndicator size="small" color={colors.iconMuted} />
              <Text className="text-xs text-text-muted">Running...</Text>
            </View>
          </ToolBlock>
        );
      }

      return (
        <ToolBlock
          label={fnLabel}
          content={output || "(no output)"}
          createdAt={message.createdAt}
          showTimestamp={showTimestamp}
        />
      );
    }

    case ToolName.WebSearch: {
      const query = (tool.input?.query as string) ?? "...";
      const fnLabel = <FnLabel fn="search" arg={query} />;
      const resultText = tool.result
        ? JSON.stringify(tool.result, null, 2)
        : undefined;
      return (
        <ToolBlock
          label={fnLabel}
          content={resultText}
          createdAt={message.createdAt}
          showTimestamp={showTimestamp}
        />
      );
    }

    case ToolName.WebFetch: {
      const url = (tool.input?.url as string) ?? "...";
      const fnLabel = <FnLabel fn="fetch" arg={url} />;
      const resultText = tool.result
        ? JSON.stringify(tool.result, null, 2)
        : undefined;
      return (
        <ToolBlock
          label={fnLabel}
          content={resultText}
          createdAt={message.createdAt}
          showTimestamp={showTimestamp}
        />
      );
    }

    default:
      return undefined;
  }
}

/**
 * Render a tool call entry. Uses custom widgets for complex tools,
 * otherwise renders `{icon} {displayHint}` + file previews from attachments.
 */
function renderToolCall(
  toolName: ToolName,
  tool: {
    input: Record<string, unknown> | null;
    result: Record<string, unknown> | null;
  },
  message: ChatMessage,
  agentId: string,
  showTimestamp: boolean,
  colors: ReturnType<typeof useNavigationTheme>,
  sandboxStreams?: Map<string, CommandStream>,
): React.ReactNode {
  // 1. Try custom widget first
  const custom = renderCustomWidget(
    toolName,
    tool,
    message,
    agentId,
    showTimestamp,
    colors,
    sandboxStreams,
  );
  if (custom !== undefined) return custom;

  // 2. Use displayHint for everything else
  const hint = message.displayHint;
  if (!hint) return null;

  const icon = TOOL_ICON[toolName];
  const files = filesFromAttachments(message.attachments ?? []);

  return (
    <View>
      <ToolStatus
        icon={icon}
        text={hint}
        variant={
          (message.displayVariant as "success" | "warning" | "error") ??
          undefined
        }
      />
      {message.displayError ? (
        <Text className="text-sm text-error italic px-1 pb-1">
          {message.displayError}
        </Text>
      ) : null}
      {files.length > 0 && (
        <View className="mt-1 gap-1">
          {files.map((file) => (
            <FileCard
              key={file.path}
              file={file}
              showInlineImage={toolName === ToolName.GenerateImage}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export const LogEntryView = React.memo(function LogEntryView({
  message,
  agentId,
  showTimestamp,
  sandboxStreams,
  onBubbleLongPress,
  reasoning,
}: {
  message: ChatMessage;
  agentId: string;
  showTimestamp: boolean;
  sandboxStreams?: Map<string, CommandStream>;
  /** Long-press handler for agent bubbles (copy + TTS). */
  onBubbleLongPress?: (logId: string, content: string) => void;
  /** Ephemeral reasoning from the stream (not persisted). */
  reasoning?: { logId: string; text: string; elapsedMs: number };
}) {
  const colors = useNavigationTheme();

  if (message.role === AgentLogRole.User) {
    return (
      <View className="py-2">
        <UserBubble content={message.content} />
        {showTimestamp && (
          <Text className="text-[10px] text-text-muted text-right mt-1 mr-1">
            {formatTime(message.createdAt)}
          </Text>
        )}
      </View>
    );
  }

  if (message.role === AgentLogRole.Agent) {
    const files = filesFromAttachments(message.attachments ?? []);
    const bubble = (
      <View className="bg-surface rounded-2xl rounded-bl-md px-3.5 pt-2 pb-0.5">
        {reasoning?.text ? (
          <ReasoningBlock
            reasoning={reasoning.text}
            elapsedMs={reasoning.elapsedMs}
          />
        ) : null}
        <Markdown variant="agent">{message.content}</Markdown>
      </View>
    );
    return (
      <View className="py-2">
        <View className="flex-row justify-start">
          {onBubbleLongPress ? (
            <Pressable
              onLongPress={() => onBubbleLongPress(message.id, message.content)}
              delayLongPress={400}
              className="max-w-[85%]"
            >
              {bubble}
            </Pressable>
          ) : (
            <View className="max-w-[85%]">{bubble}</View>
          )}
        </View>
        {files.length > 0 && (
          <View className="mt-1.5 gap-1 max-w-[85%]">
            {files.map((file) => (
              <FileCard key={file.path} file={file} />
            ))}
          </View>
        )}
        {showTimestamp && (
          <Text className="text-[10px] text-text-muted mt-1 ml-1">
            {formatTime(message.createdAt)}
          </Text>
        )}
      </View>
    );
  }

  if (message.role === AgentLogRole.Tool) {
    const tool = resolveToolFields(message);

    if (isKnownTool(tool.name)) {
      const rendered = renderToolCall(
        tool.name,
        tool,
        message,
        agentId,
        showTimestamp,
        colors,
        sandboxStreams,
      );
      if (rendered) return rendered;
    }

    // Unknown or unhandled tool: generic collapsible JSON
    const inputEmpty = !tool.input || Object.keys(tool.input).length === 0;
    const pending = inputEmpty && !tool.result;

    if (pending) {
      return (
        <ToolBlock
          label={tool.name}
          createdAt={message.createdAt}
          showTimestamp={showTimestamp}
        >
          <View className="flex-row items-center gap-2 px-3 py-2">
            <ActivityIndicator size="small" color={colors.iconMuted} />
            <Text className="text-xs text-text-muted">Running...</Text>
          </View>
        </ToolBlock>
      );
    }

    const sections: string[] = [];
    if (!inputEmpty) sections.push(JSON.stringify(tool.input, null, 2));
    if (tool.result) {
      if (sections.length > 0) sections.push("── result ──");
      sections.push(JSON.stringify(tool.result, null, 2));
    }

    return (
      <ToolBlock
        label={tool.name}
        content={sections.join("\n") || message.content}
        createdAt={message.createdAt}
        showTimestamp={showTimestamp}
      />
    );
  }

  if (message.role === AgentLogRole.System) {
    const parsed = safeParseJson(message.content);

    // Handle file_upload entries — prefer FileCard (with preview modal)
    // when resolved file data is available, fall back to static card
    if (parsed?.type === "file_upload") {
      const files = filesFromAttachments(message.attachments ?? []);
      if (files.length > 0) {
        return (
          <View className="py-1 gap-1">
            {files.map((file) => (
              <FileCard key={file.path} file={file} />
            ))}
          </View>
        );
      }
      return (
        <FileUploadCard
          data={parsed as Parameters<typeof FileUploadCard>[0]["data"]}
        />
      );
    }

    if (parsed?.type === "error") {
      return (
        <ToolStatus
          icon={CircleAlert}
          text={String(parsed.message ?? "An error occurred")}
          variant="error"
        />
      );
    }

    if (parsed) {
      const label = parsed.type ? String(parsed.type) : "system";
      return (
        <ToolBlock
          label={label}
          content={JSON.stringify(parsed, null, 2)}
          createdAt={message.createdAt}
          showTimestamp={showTimestamp}
          defaultOpen={false}
        />
      );
    }

    return (
      <ToolBlock
        label="system"
        content={message.content}
        createdAt={message.createdAt}
        showTimestamp={showTimestamp}
        defaultOpen={false}
      />
    );
  }

  return null;
});
