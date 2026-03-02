import { Link } from "react-router-dom";
import { AgentJobsQuery } from "../../graphql/queries";
import { AgentAvatar } from "../../shared/AgentAvatar";
import { Badge } from "../../shared/Badge";
import { formatDate } from "../../shared/formatDate";
import { PageHeader } from "../../shared/PageHeader";
import { QueryResult } from "../../shared/QueryResult";
import { useQuery } from "../../useQuery";

export function SchedulerTab() {
  const { data, loading, error } = useQuery(AgentJobsQuery);

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
            <div className="flex items-center gap-3">
              <AgentAvatar id={job.agent.id} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-medium text-neutral-100 truncate">
                    {job.name}
                  </h2>
                  <Badge label={job.status} />
                </div>
                <p className="text-xs text-neutral-400">{job.recurrence}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Next: {formatDate(job.nextRun, "Not scheduled")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
