import { File } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { AgentLogRole } from "../../graphql/generated/graphql";
import type { ChatMessage } from "../../hooks/useLogMessages";
import type { CommandStream } from "../../hooks/useSandboxOutput";
import { formatTime } from "../formatDate";
import { DelegateTaskCard } from "./DelegateTaskCard";
import { DocumentCard } from "./DocumentCard";
import { Markdown } from "./Markdown";
import { resolveToolFields, safeParseJson } from "./resolveToolFields";
import { ToolBlock } from "./ToolBlock";

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
          className="flex-row items-center gap-2.5 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg"
        >
          <File size={16} color="#60a5fa" />
          <View className="flex-1 min-w-0">
            <Text className="text-sm text-neutral-200" numberOfLines={1}>
              {file.filename ?? "Unknown file"}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              {file.sizeBytes != null && (
                <Text className="text-[10px] text-neutral-500">
                  {formatFileSize(file.sizeBytes)}
                </Text>
              )}
              {file.contentType && (
                <Text className="text-[10px] text-neutral-500">
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LogEntryView({
  message,
  agentId,
  showTimestamp,
  documents,
  sandboxStreams,
}: {
  message: ChatMessage;
  agentId: string;
  showTimestamp: boolean;
  documents?: Array<{ path: string; title: string; body?: string | null }>;
  sandboxStreams?: Map<string, CommandStream>;
}) {
  if (message.role === AgentLogRole.User) {
    return (
      <View className="py-1">
        <View className="flex-row justify-end">
          <View className="max-w-[80%] bg-blue-600 rounded-2xl rounded-br-md px-3.5 py-2">
            <Markdown variant="user">{message.content}</Markdown>
          </View>
        </View>
        {showTimestamp && (
          <Text className="text-[10px] text-neutral-500 text-right mt-1 mr-1">
            {formatTime(message.createdAt)}
          </Text>
        )}
      </View>
    );
  }

  if (message.role === AgentLogRole.Agent) {
    return (
      <View className="py-1">
        <View className="flex-row justify-start">
          <View className="max-w-[85%] bg-neutral-800/60 rounded-2xl rounded-bl-md px-3.5 py-2">
            <Markdown variant="agent">{message.content}</Markdown>
          </View>
        </View>
        {showTimestamp && (
          <Text className="text-[10px] text-neutral-500 mt-1 ml-1">
            {formatTime(message.createdAt)}
          </Text>
        )}
      </View>
    );
  }

  if (message.role === AgentLogRole.Tool) {
    const tool = resolveToolFields(message);

    // updateTaskStatus / updateTaskMessage -> minimal italic text
    if (tool.name === "updateTaskStatus" || tool.name === "updateTaskMessage") {
      const msg = tool.input?.message as string | undefined;
      return (
        <View className="flex-row items-start gap-1.5 py-1.5 px-1">
          <Text className="text-xs text-neutral-400 italic">
            {msg || "Progress update"}
          </Text>
        </View>
      );
    }

    // createDocument -> DocumentCard
    if (tool.name === "createDocument" && documents) {
      const docPath = tool.result?.path as string | undefined;
      const doc = docPath
        ? documents.find((d) => d.path === docPath)
        : undefined;
      if (doc) {
        return (
          <View className="py-1">
            <DocumentCard doc={doc} />
          </View>
        );
      }
    }

    // updateDocument -> DocumentCard
    if (tool.name === "updateDocument" && documents) {
      const docPath =
        (tool.result?.path as string | undefined) ??
        (tool.input?.path as string | undefined);
      const doc = docPath
        ? documents.find((d) => d.path === docPath)
        : undefined;
      if (doc) {
        return (
          <View className="py-1">
            <DocumentCard doc={doc} />
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

    // runCommand -> show command with sandbox streaming or final output
    if (tool.name === "runCommand") {
      const commandId = (tool.result?.commandId ?? tool.input?.commandId) as
        | string
        | undefined;
      const command = tool.input?.command as string | undefined;
      const hasResult = !!tool.result;
      const output = (tool.result?.output as string) ?? "";
      const exitCode = tool.result?.exitCode as number | undefined;

      // Match stream: by commandId if available, otherwise use the latest active stream
      let stream = commandId ? sandboxStreams?.get(commandId) : undefined;
      if (!hasResult && !stream && sandboxStreams) {
        for (const [, s] of sandboxStreams) {
          if (!s.done) stream = s;
        }
      }

      if (!hasResult) {
        // Show streaming output if available, otherwise "Running..." spinner
        if (stream && (stream.output || stream.done)) {
          return (
            <ToolBlock
              label={`$ ${command ?? "..."}`}
              content={stream.output || "(no output)"}
              createdAt={message.createdAt}
              showTimestamp={showTimestamp}
              streaming={!stream.done}
            >
              {!stream.done && (
                <View className="flex-row items-center gap-1.5 px-3 py-1 border-t border-neutral-800/50">
                  <ActivityIndicator size={10} color="#737373" />
                  <Text className="text-[10px] text-neutral-500">
                    Running...
                  </Text>
                </View>
              )}
              {stream.done &&
                stream.exitCode !== undefined &&
                stream.exitCode !== 0 && (
                  <View className="px-3 py-1 border-t border-neutral-800/50">
                    <Text className="text-[10px] text-red-400/70">
                      exit code {stream.exitCode}
                    </Text>
                  </View>
                )}
            </ToolBlock>
          );
        }

        return (
          <ToolBlock
            label={`$ ${command ?? "..."}`}
            createdAt={message.createdAt}
            showTimestamp={showTimestamp}
          >
            <View className="flex-row items-center gap-2 px-3 py-2">
              <ActivityIndicator size="small" color="#737373" />
              <Text className="text-xs text-neutral-400">Running...</Text>
            </View>
          </ToolBlock>
        );
      }

      return (
        <ToolBlock
          label={`$ ${command ?? "..."}${exitCode !== undefined && exitCode !== 0 ? ` (exit ${exitCode})` : ""}`}
          content={output || "(no output)"}
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
            <ActivityIndicator size="small" color="#737373" />
            <Text className="text-xs text-neutral-400">Running...</Text>
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

    // Handle file_upload entries with a dedicated card
    if (parsed?.type === "file_upload") {
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
      <View className="py-1 items-center">
        <Text className="text-xs text-neutral-500 text-center">
          {message.content}
        </Text>
      </View>
    );
  }

  return null;
}
