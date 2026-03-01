import { useParams } from "react-router-dom";
import { AGENT_JOB_QUERY } from "../../../queries";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import type { AgentJob } from "../../../types";
import { useQuery } from "../../../useQuery";

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ agentJob: AgentJob | null }>(
    AGENT_JOB_QUERY,
    { id },
  );

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const job = data?.agentJob ?? null;

  if (!job) {
    return <NotFound label="Job not found." />;
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <BackButton />

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-neutral-100">{job.name}</h1>
        <Badge label={job.status} />
      </div>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Schedule
        </h2>
        <p className="text-sm text-neutral-100">{job.recurrence}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Prompt
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          {job.description}
        </p>
      </section>

      <div className="mt-6 flex flex-col gap-2 text-xs text-neutral-400">
        <p>
          Last run:{" "}
          <span className="text-neutral-300">{formatDate(job.lastRun)}</span>
        </p>
        <p>
          Next run:{" "}
          <span className="text-neutral-300">{formatDate(job.nextRun)}</span>
        </p>
      </div>
    </div>
  );
}
