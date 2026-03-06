import { useEffect, useState } from "react";
import { gql } from "../../../../auth";
import { useTaskUpdates } from "../../../../subscriptions";

const TASK_QUERY = `query($id: ID!) {
  task(id: $id) {
    message imageUrl(width: 180)
    logs(first: 200) {
      edges { node { role toolName toolInput } }
    }
  }
}`;

interface TaskInfo {
  imageUrl: string | null;
  messages: string[];
}

const MESSAGE_TOOLS = new Set(["updateTaskStatus", "updateTaskMessage"]);

function extractMessages(
  logs: Array<{
    node: { role: string; toolName?: string | null; toolInput?: string | null };
  }>,
): string[] {
  const msgs: string[] = [];
  for (const { node } of logs) {
    if (
      node.role !== "TOOL" ||
      !node.toolName ||
      !MESSAGE_TOOLS.has(node.toolName)
    )
      continue;
    try {
      const input = JSON.parse(node.toolInput ?? "{}");
      if (input.message) msgs.push(input.message);
    } catch {
      /* skip */
    }
  }
  return msgs;
}

/**
 * Fetches a task's message history + image, then subscribes to live updates.
 * Extracts messages from both old updateTaskStatus and new updateTaskMessage tool calls.
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
        logs: {
          edges: Array<{
            node: {
              role: string;
              toolName?: string | null;
              toolInput?: string | null;
            };
          }>;
        };
      } | null;
    }>(TASK_QUERY, { id: taskId })
      .then((data) => {
        if (!cancelled && data.task) {
          const messages = extractMessages(data.task.logs.edges);
          // If no tool calls yet, fall back to current task message
          if (messages.length === 0 && data.task.message) {
            messages.push(data.task.message);
          }
          setState({ imageUrl: data.task.imageUrl, messages });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useTaskUpdates(taskId ?? "", (update) => {
    const u = update as { message?: string | null; imageUrl?: string | null };
    if (u.message) {
      setState((prev) => ({
        imageUrl: u.imageUrl ?? prev?.imageUrl ?? null,
        messages: [...(prev?.messages ?? []), u.message as string],
      }));
    }
  });

  return state;
}
