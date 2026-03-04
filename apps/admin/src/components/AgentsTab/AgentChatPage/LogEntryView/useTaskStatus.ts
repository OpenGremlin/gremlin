import { useEffect, useState } from "react";
import { gql } from "../../../../auth";
import { useTaskUpdates } from "../../../../subscriptions";

const TASK_QUERY = `query($id: ID!) {
  task(id: $id) {
    status message imageUrl(width: 90)
    logs(first: 200) {
      edges { node { role toolName toolInput } }
    }
  }
}`;

export interface StatusEntry {
  status: string;
  message: string | null;
}

interface TaskState {
  imageUrl: string | null;
  statuses: StatusEntry[];
}

function extractStatuses(
  logs: Array<{ node: { role: string; toolName?: string | null; toolInput?: string | null } }>,
): StatusEntry[] {
  const entries: StatusEntry[] = [];
  for (const { node } of logs) {
    if (node.role !== "TOOL" || node.toolName !== "updateTaskStatus") continue;
    try {
      const input = JSON.parse(node.toolInput ?? "{}");
      if (input.status) {
        entries.push({ status: input.status, message: input.message ?? null });
      }
    } catch { /* skip */ }
  }
  return entries;
}

/**
 * Fetches task status + log history, then subscribes to live updates.
 * Shows full status history from updateTaskStatus tool calls.
 */
export function useTaskStatus(taskId: string | null) {
  const [state, setState] = useState<TaskState | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    gql<{ task: {
      status: string;
      message: string | null;
      imageUrl: string | null;
      logs: { edges: Array<{ node: { role: string; toolName?: string | null; toolInput?: string | null } }> };
    } | null }>(TASK_QUERY, { id: taskId })
      .then((data) => {
        if (!cancelled && data.task) {
          const statuses = extractStatuses(data.task.logs.edges);
          // If no tool calls yet, fall back to current task status
          if (statuses.length === 0) {
            statuses.push({ status: data.task.status, message: data.task.message });
          }
          setState({ imageUrl: data.task.imageUrl, statuses });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useTaskUpdates(taskId ?? "", (update) => {
    const u = update as { status?: string; message?: string | null };
    if (u.status) {
      setState((prev) => ({
        imageUrl: prev?.imageUrl ?? null,
        statuses: [
          ...(prev?.statuses ?? []),
          { status: u.status as string, message: u.message ?? null },
        ],
      }));
    }
  });

  return state;
}
