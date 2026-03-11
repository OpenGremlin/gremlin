import { useEffect, useState } from "react";
import { gql } from "../lib/auth";
import { useTaskUpdates } from "../subscriptions";

const TASK_INFO_QUERY = `query($id: ID!) {
  task(id: $id) {
    message imageUrl(width: 180)
    documents { path title body }
    logs(first: 200) {
      edges { node { role toolName toolInput } }
    }
  }
}`;

export interface TaskDocument {
  path: string;
  title: string;
  body?: string | null;
}

interface TaskInfo {
  imageUrl: string | null;
  messages: string[];
  documents: TaskDocument[];
}

const MESSAGE_TOOLS = new Set(["updateTaskStatus", "updateTaskMessage"]);

function extractMessages(
  logs: Array<{
    node: {
      role: string;
      toolName?: string | null;
      toolInput?: string | null;
    };
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
        documents: TaskDocument[];
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
    }>({ toString: () => TASK_INFO_QUERY }, { id: taskId })
      .then((data) => {
        if (!cancelled && data.task) {
          const messages = extractMessages(data.task.logs.edges);
          if (messages.length === 0 && data.task.message) {
            messages.push(data.task.message);
          }
          setState({
            imageUrl: data.task.imageUrl,
            messages,
            documents: data.task.documents ?? [],
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
      documents?: TaskDocument[];
    };
    setState((prev) => ({
      imageUrl: u.imageUrl ?? prev?.imageUrl ?? null,
      messages: u.message
        ? [...(prev?.messages ?? []), u.message]
        : (prev?.messages ?? []),
      documents: u.documents ?? prev?.documents ?? [],
    }));
  });

  return state;
}
