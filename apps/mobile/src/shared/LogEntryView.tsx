import { ActivityIndicator, Text, View } from "react-native";
import { AgentLogRole } from "../graphql/generated/graphql";
import type { ChatMessage } from "../hooks/useLogMessages";
import { DelegateTaskCard } from "./DelegateTaskCard";
import { DocumentCard } from "./DocumentCard";
import { formatTime } from "./formatDate";
import { Markdown } from "./Markdown";
import { resolveToolFields, safeParseJson } from "./resolveToolFields";
import { ToolBlock } from "./ToolBlock";

export function LogEntryView({
  message,
  agentId,
  showTimestamp,
  documents,
}: {
  message: ChatMessage;
  agentId: string;
  showTimestamp: boolean;
  documents?: Array<{ path: string; title: string; body?: string | null }>;
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
          <View className="max-w-[85%]">
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

    // runCommand -> show command with output
    if (tool.name === "runCommand") {
      const command = tool.input?.command as string | undefined;
      const hasResult = !!tool.result;
      const output = (tool.result?.output as string) ?? "";
      const exitCode = tool.result?.exitCode as number | undefined;

      if (!hasResult) {
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
      if (sections.length > 0) sections.push("-- result --");
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
