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
  opts?: { onLogCreated?: (logId: string) => void },
) {
  const isTask = "taskId" in scope;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

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
          ...scopeRef.current,
          last: PAGE_SIZE,
          before: connection.pageInfo.startCursor,
        },
      });
    } finally {
      loadingMoreRef.current = false;
    }
  }, [connection?.pageInfo?.startCursor, fetchMore]);

  // ── Fetch newer messages (after reconnect) ────────────────────────
  const fetchNewer = useCallback(async () => {
    if (!connection?.pageInfo?.endCursor) return;
    await fetchMore({
      variables: {
        ...scopeRef.current,
        first: PAGE_SIZE,
        after: connection.pageInfo.endCursor,
      },
    });
  }, [connection?.pageInfo?.endCursor, fetchMore]);

  // ── Subscription (unified — works for both agent and task logs) ───
  const onLogCreatedRef = useRef(opts?.onLogCreated);
  onLogCreatedRef.current = opts?.onLogCreated;

  useSubscription(LogCreatedSubscription, {
    variables: scope,
    onData: ({ data: { data: subData } }) => {
      if (!subData) return;
      const msg = subData.logCreated;

      onLogCreatedRef.current?.(msg.id);
      // Update the query cache with the new log entry.
      // Avoid object spread on frozen Apollo cache results — it compiles to
      // Object.assign which calls getOwnPropertyKeys, and Hermes' Hades GC
      // can free string keys mid-enumeration causing EXC_BAD_ACCESS.
      // biome-ignore lint/suspicious/noExplicitAny: dynamic key access
      updateQuery((prev: any) => {
        if (!prev) return prev;
        const key = isTask ? "taskLogs" : "agentLogs";
        const conn = prev[key];
        if (!conn) return prev;

        const makeResult = (
          edges: typeof conn.edges,
          pageInfo?: typeof conn.pageInfo,
        ) => ({
          [key]: {
            __typename: conn.__typename,
            edges,
            pageInfo: pageInfo ?? conn.pageInfo,
          },
        });

        const replaceEdge = (
          idx: number,
          node: typeof msg,
          cursor?: string,
        ) => {
          const edges = conn.edges.slice();
          edges[idx] = {
            __typename: edges[idx].__typename,
            node,
            cursor: cursor ?? edges[idx].cursor,
          };
          return makeResult(edges);
        };

        // Duplicate — update in place
        const existingIdx = conn.edges.findIndex(
          (e: { node: { id: string } }) => e.node.id === msg.id,
        );
        if (existingIdx !== -1) {
          return replaceEdge(existingIdx, msg);
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
            return replaceEdge(pendingIdx, msg, msg.id);
          }
        }

        // Append new edge
        return makeResult(
          conn.edges.concat({
            __typename: "AgentLogEdge",
            cursor: msg.id,
            node: msg,
          }),
          {
            __typename: conn.pageInfo.__typename,
            startCursor: conn.pageInfo.startCursor,
            endCursor: msg.id,
            hasPreviousPage: conn.pageInfo.hasPreviousPage,
            hasNextPage: conn.pageInfo.hasNextPage,
          },
        );
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
