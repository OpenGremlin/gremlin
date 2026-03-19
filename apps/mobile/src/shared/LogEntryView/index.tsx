import {
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  CircleAlert,
  File,
  Hammer,
  Key,
  List,
  Monitor,
  Save,
  XCircle,
} from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import type { AgentLogsQuery } from "../../graphql/generated/graphql";
import { AgentLogRole } from "../../graphql/generated/graphql";
import type { ChatMessage } from "../../hooks/useLogMessages";
import type { CommandStream } from "../../hooks/useSandboxOutput";
import { useNavigationTheme } from "../../lib/useNavigationTheme";
import { FileCard } from "../FileCard";
import { formatTime } from "../formatDate";
import { formatFileSize } from "../formatFileSize";
import { CreateDocumentCard } from "./CreateDocumentCard";
import { DelegateTaskCard } from "./DelegateTaskCard";
import { FnLabel } from "./FnLabel";
import { Markdown } from "./Markdown";
import { resolveToolFields, safeParseJson } from "./resolveToolFields";
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

type FileNode =
  AgentLogsQuery["agentLogs"]["edges"][number]["node"]["files"][number];

export function LogEntryView({
  message,
  agentId,
  showTimestamp,
  taskFiles,
  sandboxStreams,
}: {
  message: ChatMessage;
  agentId: string;
  showTimestamp: boolean;
  taskFiles?: FileNode[];
  sandboxStreams?: Map<string, CommandStream>;
}) {
  const colors = useNavigationTheme();

  if (message.role === AgentLogRole.User) {
    return (
      <View className="py-2">
        <View className="flex-row justify-end">
          <View className="max-w-[80%] bg-user-bubble rounded-2xl rounded-br-md px-3.5 pt-2 pb-0.5">
            <Markdown variant="user">{message.content}</Markdown>
          </View>
        </View>
        {showTimestamp && (
          <Text className="text-[10px] text-text-muted text-right mt-1 mr-1">
            {formatTime(message.createdAt)}
          </Text>
        )}
      </View>
    );
  }

  if (message.role === AgentLogRole.Agent) {
    const files = "files" in message ? (message.files ?? []) : [];
    return (
      <View className="py-2">
        <View className="flex-row justify-start">
          <View className="max-w-[85%] bg-surface rounded-2xl rounded-bl-md px-3.5 pt-2 pb-0.5">
            <Markdown variant="agent">{message.content}</Markdown>
          </View>
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

    // updateTaskStatus / updateTaskMessage
    if (tool.name === "updateTaskStatus" || tool.name === "updateTaskMessage") {
      const msg = tool.input?.message as string | undefined;
      return <ToolStatus icon={Hammer} text={msg || "Progress update"} />;
    }

    // ensureSandbox
    if (tool.name === "ensureSandbox") {
      const status = tool.result?.status as string | undefined;
      if (status === "ready") {
        return (
          <ToolStatus
            icon={CheckCircle}
            text="Sandbox ready"
            variant="success"
          />
        );
      }
      if (status === "error") {
        return (
          <ToolStatus
            icon={CircleAlert}
            text={`Sandbox error: ${tool.result?.error ?? "unknown"}`}
            variant="error"
          />
        );
      }
      return (
        <ToolStatus
          icon={Monitor}
          text="Connecting to sandbox… this may take a few minutes"
          variant="warning"
        />
      );
    }

    // loadSkill
    if (tool.name === "loadSkill") {
      const skillId = tool.input?.skillId as string | undefined;
      if (tool.result?.error) {
        return (
          <ToolStatus
            icon={XCircle}
            text={`Failed to load ${skillId ?? "skill"}: ${tool.result.error}`}
            variant="error"
          />
        );
      }
      if (!tool.result) {
        return (
          <ToolStatus
            icon={BookOpen}
            text={`Loading ${skillId ?? "skill"}...`}
          />
        );
      }
      return (
        <ToolStatus
          icon={BookOpen}
          text={`Loaded ${skillId ?? "skill"} instructions`}
        />
      );
    }

    // authenticate
    if (tool.name === "authenticate") {
      const skillId = tool.input?.skillId as string | undefined;
      if (tool.result?.error) {
        return (
          <ToolStatus
            icon={XCircle}
            text={`Auth failed for ${skillId ?? "skill"}: ${tool.result.error}`}
            variant="error"
          />
        );
      }
      if (!tool.result) {
        return (
          <ToolStatus
            icon={Key}
            text={`Authenticating ${skillId ?? "skill"}...`}
          />
        );
      }
      const connLabel = tool.result?.connectionLabel as string | undefined;
      const label = connLabel ? ` (${connLabel})` : "";
      return (
        <ToolStatus
          icon={Key}
          text={`Authenticated ${skillId ?? "skill"}${label}`}
        />
      );
    }

    // saveMemory
    if (tool.name === "saveMemory") {
      const key =
        (tool.input?.key as string | undefined) ??
        (tool.input?.topic as string | undefined);
      return (
        <ToolStatus
          icon={Save}
          text={key ? `Saved memory: ${key}` : "Saved memory"}
        />
      );
    }

    // recallMemory
    if (tool.name === "recallMemory") {
      const query = tool.input?.query as string | undefined;
      return (
        <ToolStatus
          icon={Brain}
          text={query ? `Recalled: ${query}` : "Recalled memories"}
        />
      );
    }

    // scheduleJob
    if (tool.name === "scheduleJob") {
      const schedule = tool.input?.schedule as string | undefined;
      return (
        <ToolStatus
          icon={Calendar}
          text={schedule ? `Scheduled job: ${schedule}` : "Scheduled job"}
        />
      );
    }

    // listJobs
    if (tool.name === "listJobs") {
      return <ToolStatus icon={List} text="Listed jobs" />;
    }

    // updateJob
    if (tool.name === "updateJob") {
      return <ToolStatus icon={Calendar} text="Updated job" />;
    }

    // createDocument -> FileCard (with pending/fallback states)
    if (tool.name === "createDocument") {
      return (
        <CreateDocumentCard
          toolInput={tool.input}
          toolResult={tool.result}
          files={taskFiles}
          createdAt={message.createdAt}
          showTimestamp={showTimestamp}
        />
      );
    }

    // updateDocument -> FileCard
    if (tool.name === "updateDocument" && taskFiles) {
      const docPath =
        (tool.result?.path as string | undefined) ??
        (tool.input?.path as string | undefined);
      const file = docPath
        ? taskFiles.find((f) => f.path === docPath)
        : undefined;
      if (file) {
        return (
          <View className="py-2">
            <FileCard file={file} />
          </View>
        );
      }
    }

    // delegateTask -> DelegateTaskCard
    if (tool.name === "delegateTask") {
      return (
        <DelegateTaskCard
          agentId={agentId}
          taskId={(tool.result?.taskId as string) ?? null}
          taskTitle={(tool.input?.title as string) ?? "Untitled task"}
        />
      );
    }

    // runCommand -> run() style label with streaming
    if (tool.name === "runCommand") {
      const commandId = tool.result?.commandId as string | undefined;
      const command = (tool.input?.command as string | undefined) ?? "...";
      const hasResult = !!tool.result;
      const output = (tool.result?.output as string) ?? "";
      const exitCode = tool.result?.exitCode as number | undefined;
      const exitSuffix =
        exitCode !== undefined && exitCode !== 0 ? ` exit ${exitCode}` : "";

      const fnLabel = <FnLabel fn="run" arg={command + exitSuffix} />;

      // Match stream: by commandId if available, otherwise use the latest active stream
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

    // webSearch (brave / tavily)
    if (
      tool.name === "webSearch" ||
      tool.name === "braveSearch" ||
      tool.name === "tavilySearch"
    ) {
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

    // webFetch
    if (tool.name === "webFetch") {
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

    // Generic tool: collapsible JSON
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
      const files = "files" in message ? (message.files ?? []) : [];
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
}
