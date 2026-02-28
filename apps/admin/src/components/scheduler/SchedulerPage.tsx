import { Link } from "react-router-dom";
import type { AgentJob } from "../../types";
import { Badge } from "../../shared/Badge";
import { formatDate } from "../../shared/formatDate";
import { PageHeader } from "../../shared/PageHeader";
import { QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";
import { AGENT_JOBS_QUERY } from "../../queries";

export function SchedulerPage() {
  const { data, loading, error } =
    useQuery<{ agentJobs: AgentJob[] }>(AGENT_JOBS_QUERY);

  const jobs = data?.agentJobs ?? [];

  return (
    <div>
      <PageHeader title="Scheduler" />

      <QueryResult loading={loading} error={error} />

      <div className="flex flex-col gap-3 px-4 pb-4">
        {jobs.map((job) => (
          <Link
            key={job.id}
            to={`/scheduler/${job.id}`}
            className="block bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-neutral-100">
                {job.name}
              </h2>
              <Badge label={job.status} />
            </div>
            <p className="text-xs text-neutral-400">
              Next: {formatDate(job.nextRun, "Not scheduled")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
