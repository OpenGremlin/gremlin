import { useSubscription } from "@apollo/client";
import { useEffect, useState } from "react";
import type { AttachmentFieldsFragment } from "../graphql/generated/graphql";
import { TaskQuery, TaskUpdatedSubscription } from "../graphql/queries";
import { execute } from "../lib/apolloClient";

interface TaskInfo {
  emoji: string | null;
  lastMessage: string | null;
  attachments: readonly AttachmentFieldsFragment[];
}

/**
 * Fetches a task's latest message + attachments, then subscribes to live updates.
 */
export function useTaskInfo(taskId: string | null) {
  const [state, setState] = useState<TaskInfo | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    execute(TaskQuery, { id: taskId })
      .then((data) => {
        if (!cancelled && data.task) {
          setState({
            emoji: data.task.emoji ?? null,
            lastMessage: data.task.message ?? null,
            attachments: data.task.attachments,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useSubscription(TaskUpdatedSubscription, {
    variables: { taskId: taskId ?? "" },
    onData: ({ data: { data } }) => {
      if (!data) return;
      const u = data.taskUpdated;
      setState((prev) => ({
        emoji: u.emoji ?? prev?.emoji ?? null,
        lastMessage: u.message ?? prev?.lastMessage ?? null,
        attachments: u.attachments ?? prev?.attachments ?? [],
      }));
    },
  });

  return state;
}
