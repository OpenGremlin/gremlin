import { TASKS_QUERY } from "../../queries";
import { QueryResult } from "../../shared/QueryResult";
import type { Task } from "../../types";
import { useQuery } from "../../useQuery";
import { TaskCard } from "./TaskCard";

interface TaskEdge {
  cursor: string;
  node: Task;
}

interface TaskConnection {
  edges: TaskEdge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export function TasksTab() {
  const { data, loading, error } = useQuery<{ tasks: TaskConnection }>(
    TASKS_QUERY,
    { last: 50 },
  );

  const tasks = data?.tasks.edges.map((e) => e.node) ?? [];

  return (
    <div className="min-h-screen bg-neutral-950">
      <QueryResult loading={loading} error={error} />

      <div className="divide-y divide-neutral-800/50 pb-24">
        {tasks.map((item) => (
          <TaskCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
