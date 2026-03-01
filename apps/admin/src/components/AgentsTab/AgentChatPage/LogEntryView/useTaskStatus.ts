import { useCallback, useEffect, useState } from "react";
import { gql } from "../../../../auth";
import { TASK_UPDATED_SUBSCRIPTION } from "../../../../queries";
import { useSubscription } from "../../../../useSubscription";

const TASK_STATUS_QUERY = `query($id: ID!) { task(id: $id) { status message } }`;

const NOOP = () => {};

/**
 * Fetches initial task status, then subscribes to live updates.
 */
export function useTaskStatus(taskId: string | null) {
  const [status, setStatus] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);

  // Fetch initial status
  useEffect(() => {
    if (!taskId) return;
    gql<{ task: { status: string; message: string | null } | null }>(
      TASK_STATUS_QUERY,
      { id: taskId },
    ).then((data) => {
      if (data.task) {
        setStatus(data.task.status);
        setMessage(data.task.message);
      }
    });
  }, [taskId]);

  // Subscribe to live updates
  const handler = useCallback(
    (data: { taskUpdated: { status: string; message: string | null } }) => {
      setStatus(data.taskUpdated.status);
      setMessage(data.taskUpdated.message);
    },
    [],
  );

  useSubscription(
    taskId ? TASK_UPDATED_SUBSCRIPTION : "",
    { taskId: taskId ?? "" },
    taskId ? handler : NOOP,
  );

  return { status, message };
}
