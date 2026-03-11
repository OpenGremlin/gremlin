import { useEffect, useState } from "react";
import { gql } from "../lib/auth";
import { useTaskUpdates } from "../subscriptions";

const TASK_INFO_QUERY = `query($id: ID!) {
  task(id: $id) {
    message imageUrl(width: 80)
  }
}`;

interface TaskInfo {
  imageUrl: string | null;
  lastMessage: string | null;
}

/**
 * Fetches a task's latest message + image, then subscribes to live updates.
 */
export function useTaskInfo(taskId: string | null) {
  const [state, setState] = useState<TaskInfo | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    gql<{
      task: {
        message: string | null;
        imageUrl: string | null;
      } | null;
    }>({ toString: () => TASK_INFO_QUERY }, { id: taskId })
      .then((data) => {
        if (!cancelled && data.task) {
          setState({
            imageUrl: data.task.imageUrl,
            lastMessage: data.task.message,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useTaskUpdates(taskId ?? "", (update) => {
    const u = update as {
      message?: string | null;
      imageUrl?: string | null;
    };
    setState((prev) => ({
      imageUrl: u.imageUrl ?? prev?.imageUrl ?? null,
      lastMessage: u.message ?? prev?.lastMessage ?? null,
    }));
  });

  return state;
}
