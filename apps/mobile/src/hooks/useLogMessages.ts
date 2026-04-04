import { useQuery, useSubscription } from "@apollo/client";
import { useCallback, useMemo, useRef } from "react";
import type { AgentLogsQuery } from "../graphql/generated/graphql";
import {
  AgentLogsQuery as AgentLogsDoc,
  LogCreatedSubscription,
  TaskLogsQuery,
} from "../graphql/queries";
import { useWsReconnect } from "../lib/wsClient";

export type ChatMessage = AgentLogsQuery["agentLogs"]["edges"][number]["node"];

const PAGE_SIZE = 20;

export function shouldShowTimestamp(
  msg: ChatMessage,
  next: ChatMessage | undefined,
): boolean {
  if (!next) return true;
  if (msg.role !== next.role) return true;
  const gap =
    new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime();
  return Math.abs(gap) >= 900_000;
}

export function useLogMessages(
  scope: { agentId: string } | { taskId: string },
  opts?: {
    onLogCreated?: (logId: string) => void;
    onAgentLogCreated?: (logId: string) => void;
  },
) {
  const isTask = "taskId" in scope;

  // ── Paginated query ───────────────────────────────────────────────
  // biome-ignore lint/suspicious/noExplicitAny: agent/task query union
  const query = (isTask ? TaskLogsQuery : AgentLogsDoc) as any;
  const { data, loading, error, fetchMore, refetch, updateQuery } = useQuery(
    query,
    {
      variables: { ...scope, last: PAGE_SIZE },
      notifyOnNetworkStatusChange: true,
    },
  );

  const connection = data
    ? "taskLogs" in data
      ? (data as { taskLogs: AgentLogsQuery["agentLogs"] }).taskLogs
      : (data as AgentLogsQuery).agentLogs
    : undefined;

  const hasMore = connection?.pageInfo?.hasPreviousPage ?? false;
  const loadingMoreRef = useRef(false);

  const messages: ChatMessage[] = useMemo(
    () =>
      (connection?.edges ?? [])
        .map((e) => e.node)
        .slice()
        .reverse(),
    [connection?.edges],
  );

  // ── Load older messages ───────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!connection?.pageInfo?.startCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      await fetchMore({
        variables: {
          ...scope,
          last: PAGE_SIZE,
          before: connection.pageInfo.startCursor,
        },
      });
    } finally {
      loadingMoreRef.current = false;
    }
  }, [connection?.pageInfo?.startCursor, fetchMore, scope]);

  // ── Fetch newer messages (after reconnect) ────────────────────────
  const fetchNewer = useCallback(async () => {
    if (!connection?.pageInfo?.endCursor) return;
    await fetchMore({
      variables: {
        ...scope,
        first: PAGE_SIZE,
        after: connection.pageInfo.endCursor,
      },
    });
  }, [connection?.pageInfo?.endCursor, fetchMore, scope]);

  // ── Subscription (unified — works for both agent and task logs) ───
  const onLogCreatedRef = useRef(opts?.onLogCreated);
  onLogCreatedRef.current = opts?.onLogCreated;
  const onAgentLogCreatedRef = useRef(opts?.onAgentLogCreated);
  onAgentLogCreatedRef.current = opts?.onAgentLogCreated;

  useSubscription(LogCreatedSubscription, {
    variables: scope,
    onData: ({ data: { data: subData } }) => {
      if (!subData) return;
      const msg = subData.logCreated;

      onLogCreatedRef.current?.(msg.id);
      if (msg.role === "AGENT" && msg.content && !msg.toolName) {
        onAgentLogCreatedRef.current?.(msg.id);
      }

      // Update the query cache with the new log entry
      // biome-ignore lint/suspicious/noExplicitAny: dynamic key access
      updateQuery((prev: any) => {
        if (!prev) return prev;
        const key = isTask ? "taskLogs" : "agentLogs";
        const conn = prev[key];
        if (!conn) return prev;

        // Duplicate — update in place
        const existingIdx = conn.edges.findIndex(
          (e: { node: { id: string } }) => e.node.id === msg.id,
        );
        if (existingIdx !== -1) {
          const newEdges = [...conn.edges];
          newEdges[existingIdx] = { ...newEdges[existingIdx], node: msg };
          return { ...prev, [key]: { ...conn, edges: newEdges } };
        }

        // TOOL result — replace pending tool entry (same toolName, no result)
        if (msg.role === "TOOL" && msg.toolResult) {
          const pendingIdx = conn.edges.findIndex(
            (e: { node: ChatMessage }) =>
              e.node.role === "TOOL" &&
              e.node.toolName === msg.toolName &&
              !e.node.toolResult,
          );
          if (pendingIdx !== -1) {
            const newEdges = [...conn.edges];
            newEdges[pendingIdx] = {
              ...newEdges[pendingIdx],
              node: msg,
              cursor: msg.id,
            };
            return { ...prev, [key]: { ...conn, edges: newEdges } };
          }
        }

        // Append new edge
        return {
          ...prev,
          [key]: {
            ...conn,
            edges: [
              ...conn.edges,
              { __typename: "AgentLogEdge", cursor: msg.id, node: msg },
            ],
            pageInfo: { ...conn.pageInfo, endCursor: msg.id },
          },
        };
      });
    },
  });

  // ── Reconnect recovery ────────────────────────────────────────────
  useWsReconnect(fetchNewer);

  return {
    messages,
    loading: loading && messages.length === 0,
    error: error?.message ?? null,
    hasMore,
    loadMore,
    loadingMore: loadingMoreRef.current,
    refetch,
    fetchNewer,
  };
}
