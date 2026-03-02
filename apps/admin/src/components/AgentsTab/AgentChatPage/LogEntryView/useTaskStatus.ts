import { useEffect, useState } from "react";
import { gql } from "../../../../auth";
import type { TaskUpdatedSubscription as TaskUpdatedSub } from "../../../../graphql/generated/graphql";
import { TaskUpdatedSubscription } from "../../../../graphql/queries";
import { useSubscription } from "../../../../useSubscription";

const TASK_STATUS_QUERY = `query($id: ID!) { task(id: $id) { status message } }`;

interface TaskState {
  status: string;
  message: string | null;
}

/**
 * Fetches initial task status, then subscribes to live updates.
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

  useSubscription<TaskUpdatedSub>(
    taskId ? TaskUpdatedSubscription : "",
    { taskId: taskId ?? "" },
    (data) =>
      setState({
        status: data.taskUpdated.status,
        message: data.taskUpdated.message ?? null,
      }),
  );

  return state;
}
