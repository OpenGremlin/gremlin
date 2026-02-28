import { useParams } from "react-router-dom";
import type { AgentJob } from "../../types";
import { Badge } from "../../shared/Badge";
import { BackButton } from "../../shared/BackButton";

const jobs: AgentJob[] = [
  {
    id: "job-1",
    name: "Morning News Digest",
    description:
      "Scan top news sources for headlines relevant to my interests, summarize the top 10 stories, and draft a briefing email with key takeaways.",
    recurrence: "Every weekday at 7:00 AM EST",
    status: "running",
    lastRun: "2026-02-28T12:00:00Z",
    nextRun: "2026-03-01T12:00:00Z",
  },
  {
    id: "job-2",
    name: "Email Triage",
    description:
      "Review unread emails, categorize by urgency, draft replies to routine messages, and flag anything requiring personal attention.",
    recurrence: "Every 2 hours, 8 AM - 6 PM weekdays",
    status: "idle",
    lastRun: "2026-02-28T14:00:00Z",
    nextRun: "2026-02-28T16:00:00Z",
  },
  {
    id: "job-3",
    name: "Weekly Report",
    description:
      "Aggregate completed tasks from project management tools, compile metrics from analytics dashboards, and generate a formatted weekly summary.",
    recurrence: "Every Friday at 4:00 PM EST",
    status: "idle",
    lastRun: "2026-02-27T21:00:00Z",
    nextRun: "2026-03-06T21:00:00Z",
  },
  {
    id: "job-4",
    name: "Stock Monitor",
    description:
      "Track watchlist stocks for significant price movements or volume spikes. Alert immediately if any position moves more than 3% in either direction.",
    recurrence: "Every 15 minutes during market hours",
    status: "error",
    lastRun: "2026-02-28T15:30:00Z",
    nextRun: null,
  },
  {
    id: "job-5",
    name: "Calendar Prep",
    description:
      "Review tomorrow's calendar, pull relevant context for each meeting, and prepare brief agendas with talking points and attendee backgrounds.",
    recurrence: "Every day at 9:00 PM EST",
    status: "paused",
    lastRun: "2026-02-26T02:00:00Z",
    nextRun: null,
  },
];

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
  const job = jobs.find((j) => j.id === id);

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
