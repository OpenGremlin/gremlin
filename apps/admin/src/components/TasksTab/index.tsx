import { TasksQuery } from "../../graphql/queries";
import { QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { TaskCard } from "./TaskCard";

export function TasksTab() {
  const { data, loading, error } = useQuery(TasksQuery, { last: 50 });

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
