import { useLocalSearchParams } from "expo-router";
import { ArrowUp, Terminal } from "lucide-react-native";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { AgentLogRole } from "../../../../../src/graphql/generated/graphql";
import { TaskQuery } from "../../../../../src/graphql/queries";
import { useChatSend } from "../../../../../src/hooks/useChatSend";
import {
  type ChatMessage,
  shouldShowTimestamp,
  useLogMessages,
} from "../../../../../src/hooks/useLogMessages";
import { useQuery } from "../../../../../src/hooks/useQuery";
import { useSandboxOutput } from "../../../../../src/hooks/useSandboxOutput";
import { formatTime } from "../../../../../src/shared/formatDate";
import { PendingMessageBubble } from "../../../../../src/shared/PendingMessageBubble";
import { NotFound, QueryResult } from "../../../../../src/shared/QueryResult";

function LogEntryView({
  message,
  showTimestamp,
}: {
  message: ChatMessage;
  showTimestamp: boolean;
}) {
  if (message.role === AgentLogRole.User) {
    return (
      <View className="py-1">
        <View className="flex-row justify-end">
          <View className="max-w-[80%] bg-blue-600 rounded-2xl rounded-br-md px-3.5 py-2">
            <Text className="text-white text-sm">{message.content}</Text>
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
            <Text className="text-neutral-100 text-sm leading-5">
              {message.content}
            </Text>
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
    const status = message.toolResult ? "done" : "running";
    return (
      <View className="py-0.5 px-1">
        <Text className="text-xs text-neutral-500">
          {message.toolName} <Text className="text-neutral-600">{status}</Text>
        </Text>
      </View>
    );
  }

  if (message.role === AgentLogRole.System) {
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

function SandboxPanel({ taskId }: { taskId: string }) {
  const streams = useSandboxOutput(taskId);
  const entries = Array.from(streams.entries());

  if (entries.length === 0) return null;

  const latest = entries[entries.length - 1];
  if (!latest) return null;

  const [_commandId, stream] = latest;

  return (
    <Pressable className="mx-4 mt-1 mb-1 bg-neutral-900 border border-neutral-800 rounded-lg p-3">
      <View className="flex-row items-center gap-2 mb-1">
        <Terminal size={12} color="#737373" />
        <Text className="text-xs text-neutral-400 font-mono">
          {stream.done ? `exit ${stream.exitCode ?? 0}` : "running..."}
        </Text>
      </View>
      {stream.output ? (
        <Text className="text-xs text-neutral-300 font-mono" numberOfLines={6}>
          {stream.output.slice(-500)}
        </Text>
      ) : null}
    </Pressable>
  );
}

function ChatInputBar({
  input,
  setInput,
  onSend,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}) {
  const canSend = input.trim().length > 0;

  return (
    <View className="border-t border-neutral-800 bg-neutral-950 px-3 py-2">
      <View className="flex-row items-end gap-2">
        <TextInput
          className="flex-1 bg-neutral-800 rounded-2xl px-4 py-2.5 text-neutral-100 text-sm max-h-28"
          value={input}
          onChangeText={setInput}
          placeholder="Message..."
          placeholderTextColor="#525252"
          multiline
          onSubmitEditing={onSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          className={`w-8 h-8 rounded-full items-center justify-center mb-0.5 ${
            canSend ? "bg-blue-600" : "bg-neutral-700"
          }`}
        >
          <ArrowUp size={18} color={canSend ? "#fff" : "#737373"} />
        </Pressable>
      </View>
    </View>
  );
}

export default function TaskThreadScreen() {
  const { id, taskId } = useLocalSearchParams<{
    id: string;
    taskId: string;
  }>();

  const { messages, loading, hasMore, loadMore, loadingMore } = useLogMessages({
    taskId,
  });
  const {
    data: taskData,
    loading: taskLoading,
    error: taskError,
  } = useQuery(TaskQuery, { id: taskId });

  const { input, setInput, pendingMessages, listRef, handleSend } = useChatSend(
    { agentId: id, taskId, messages },
  );

  const task = taskData?.task;

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const next = index > 0 ? messages[index - 1] : undefined;
      const show = shouldShowTimestamp(item, next);
      return <LogEntryView message={item} showTimestamp={show} />;
    },
    [messages],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  if (taskLoading || loading) {
    return <QueryResult loading error={null} />;
  }
  if (taskError) {
    return <QueryResult loading={false} error={taskError} />;
  }
  if (!task) {
    return <NotFound label="Task not found" />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View className="px-4 py-2 border-b border-neutral-800">
        <Text className="text-neutral-100 font-medium" numberOfLines={1}>
          {task.title ?? task.message}
        </Text>
        {task.completedAt && (
          <Text className="text-xs text-neutral-500 mt-0.5">
            Completed {formatTime(task.completedAt)}
          </Text>
        )}
      </View>

      <SandboxPanel taskId={taskId} />

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          hasMore ? (
            <Pressable
              onPress={loadMore}
              disabled={loadingMore}
              className="items-center py-3"
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#737373" />
              ) : (
                <Text className="text-xs text-neutral-500">
                  Load older messages
                </Text>
              )}
            </Pressable>
          ) : null
        }
        ListHeaderComponent={
          pendingMessages.length > 0 ? (
            <View>
              {pendingMessages.map((content) => (
                <PendingMessageBubble key={content} content={content} />
              ))}
            </View>
          ) : null
        }
      />

      <ChatInputBar input={input} setInput={setInput} onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}
