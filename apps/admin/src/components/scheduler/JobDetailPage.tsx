import { useParams } from "react-router-dom";
import type { AgentJob } from "../../types";
import { Badge } from "../../shared/Badge";
import { BackButton } from "../../shared/BackButton";
import { useQuery } from "../../useQuery";
import { AGENT_JOB_QUERY } from "../../queries";

function formatDate(date: string | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ agentJob: AgentJob | null }>(
    AGENT_JOB_QUERY,
    { id },
  );

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="text-neutral-500 mt-4 text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="text-red-400 mt-4 text-sm">Error: {error}</p>
      </div>
    );
  }

  const job = data?.agentJob ?? null;

  if (!job) {
    return (
      <div className="px-4 pt-6">
        <BackButton />
        <p className="mt-4 text-neutral-400">Job not found.</p>
      </div>
    );
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
          Last run: <span className="text-neutral-300">{formatDate(job.lastRun)}</span>
        </p>
        <p>
          Next run: <span className="text-neutral-300">{formatDate(job.nextRun)}</span>
        </p>
      </div>
    </div>
  );
}
