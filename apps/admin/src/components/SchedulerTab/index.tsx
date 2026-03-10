import { Play, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { gql } from "../../auth";
import { AgentJobsQuery } from "../../graphql/queries";
import { useQuery } from "../../hooks/useQuery";
import { AgentAvatar } from "../../shared/AgentAvatar";
import { Badge } from "../../shared/Badge";
import { formatDate } from "../../shared/formatDate";
import { PageHeader } from "../../shared/PageHeader";
import { QueryResult } from "../../shared/QueryResult";

function RunNowButton({ jobId }: { jobId: string }) {
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);

  return (
    <button
      type="button"
      disabled={triggering}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTriggering(true);
        try {
          await gql(
            `mutation TriggerJob($id: ID!) { triggerJob(id: $id) }`,
            { id: jobId },
          );
          setTriggered(true);
          setTimeout(() => setTriggered(false), 3000);
        } finally {
          setTriggering(false);
        }
      }}
      className="shrink-0 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50 transition-colors disabled:opacity-50"
      title="Run now"
    >
      {triggered ? (
        <span className="text-xs text-green-400">Queued</span>
      ) : (
        <Play size={14} />
      )}
    </button>
  );
}

export function SchedulerTab() {
  const { data, loading, error } = useQuery(AgentJobsQuery);

  const jobs = data?.agentJobs ?? [];

  return (
    <div>
      <PageHeader title="Job Scheduler" />

      <QueryResult loading={loading} error={error} />

      <div className="flex flex-col gap-3 px-6 pb-6">
        {jobs.map((job) => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className="block bg-neutral-900 rounded-xl p-4 transition-colors hover:bg-neutral-800/80"
          >
            <div className="flex items-center gap-3">
              <AgentAvatar id={job.agent.id} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-medium text-neutral-100 truncate">
                    {job.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <RunNowButton jobId={job.id} />
                    <Badge label={job.status} />
                  </div>
                </div>
                <p className="text-xs text-neutral-400">{job.recurrence}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Next: {formatDate(job.nextRun, "Not scheduled")}
                </p>
              </div>
            </div>
          </Link>
        ))}

        <Link
          to="/jobs/new"
          className="self-start flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <Plus size={14} />
          New Job
        </Link>
      </div>
    </div>
  );
}
