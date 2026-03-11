import { router, useLocalSearchParams } from "expo-router";
import { ArrowUp, ChevronRight } from "lucide-react-native";
import { useCallback, useMemo } from "react";
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
import { AgentQuery, TaskQuery } from "../../../../src/graphql/queries";
import { useChatSend } from "../../../../src/hooks/useChatSend";
import {
  type ChatMessage,
  shouldShowTimestamp,
  useLogMessages,
} from "../../../../src/hooks/useLogMessages";
import { useQuery } from "../../../../src/hooks/useQuery";
import { AgentAvatar } from "../../../../src/shared/AgentAvatar";
import { LogEntryView } from "../../../../src/shared/LogEntryView";
import { PendingMessageBubble } from "../../../../src/shared/PendingMessageBubble";
import { NotFound, QueryResult } from "../../../../src/shared/QueryResult";

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

export default function AgentChatScreen() {
  const { id, taskId } = useLocalSearchParams<{
    id: string;
    taskId?: string;
  }>();

  const scope = useMemo(
    () => (taskId ? { taskId } : { agentId: id }),
    [id, taskId],
  );

  const { messages, loading, hasMore, loadMore, loadingMore } =
    useLogMessages(scope);
  const {
    data: agentData,
    loading: agentLoading,
    error: agentError,
  } = useQuery(AgentQuery, { id });
  const { data: taskData } = useQuery(
    TaskQuery,
    taskId ? { id: taskId } : undefined,
  );

  const { input, setInput, pendingMessages, listRef, handleSend } = useChatSend(
    { agentId: id, taskId, messages },
  );

  const agent = agentData?.agent;
  const task = taskData?.task;
  const taskDocs = task?.documents;

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const next = index > 0 ? messages[index - 1] : undefined;
      const show = shouldShowTimestamp(item, next);
      return (
        <LogEntryView
          message={item}
          agentId={id}
          showTimestamp={show}
          documents={taskDocs}
        />
      );
    },
    [messages, id, taskDocs],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  if (agentLoading || loading) {
    return <QueryResult loading error={null} />;
  }
  if (agentError) {
    return <QueryResult loading={false} error={agentError} />;
  }
  if (!agent) {
    return <NotFound label="Agent not found" />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Pressable
        onPress={() => router.push(`/agents/${id}/config`)}
        className="flex-row items-center gap-3 px-4 py-2 border-b border-neutral-800"
      >
        <AgentAvatar id={id} size={32} />
        <Text className="text-neutral-100 font-medium flex-1">
          {agent.name}
        </Text>
        <ChevronRight size={16} color="#525252" />
      </Pressable>

      {taskId && task && (
        <View className="px-4 py-2 bg-neutral-900 border-b border-neutral-800">
          <Text className="text-xs text-neutral-400">Task</Text>
          <Text className="text-sm text-neutral-200" numberOfLines={1}>
            {task.title ?? task.message}
          </Text>
        </View>
      )}

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
