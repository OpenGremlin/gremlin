import { useEffect, useState } from "react";
import { TaskQuery } from "../graphql/queries";
import { gql } from "../lib/auth";
import { useTaskUpdates } from "../subscriptions";

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
    gql(TaskQuery, { id: taskId })
      .then((data) => {
        if (!cancelled && data.task) {
          setState({
            imageUrl: data.task.imageUrl ?? null,
            lastMessage: data.task.message ?? null,
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
