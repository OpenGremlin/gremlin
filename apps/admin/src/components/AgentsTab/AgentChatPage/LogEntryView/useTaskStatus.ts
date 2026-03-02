import { useEffect, useState } from "react";
import { gql } from "../../../../auth";
import { useTaskUpdates } from "../../../../subscriptions";

const TASK_STATUS_QUERY = `query($id: ID!) { task(id: $id) { status message } }`;

interface TaskState {
  status: string;
  message: string | null;
}

/**
 * Fetches initial task status, then subscribes to live updates
 * via the batched task subscription manager (single SSE connection
 * shared across all task cards).
 */
export function useTaskStatus(taskId: string | null) {
  const [state, setState] = useState<TaskState | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    gql<{ task: TaskState | null }>(TASK_STATUS_QUERY, { id: taskId })
      .then((data) => {
        if (!cancelled && data.task) {
          setState(data.task);
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
      setState({ status: u.status, message: u.message ?? null });
    }
  });

  return state;
}
