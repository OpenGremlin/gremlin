import cronstrue from "cronstrue";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { gql } from "../../../auth";
import type {
  AgentJobQuery as AgentJobQueryType,
  UpdateAgentJobMutation,
} from "../../../graphql/generated/graphql";
import {
  AgentJobQuery,
  AgentsQuery,
  UpdateAgentJobMutation as UpdateAgentJobDoc,
} from "../../../graphql/queries";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { useQuery } from "../../../useQuery";
import { TaskCard } from "../../TasksTab/TaskCard";

type Job = NonNullable<AgentJobQueryType["agentJob"]>;

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(AgentJobQuery, { id: id! });
  const { data: agentsData } = useQuery(AgentsQuery);

  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Snapshot from server
  const [savedJob, setSavedJob] = useState<Job | null>(null);

  if (loading || error) {
    return <QueryResult loading={loading} error={error} backButton />;
  }

  const job = savedJob ?? data?.agentJob ?? null;

  if (!job) {
    return <NotFound label="Job not found." />;
  }

  const agents = agentsData?.agents ?? [];
  const currentRecurrence = recurrence ?? job.recurrence;
  const currentDescription = description ?? job.description;
  const currentAgentId = agentId ?? job.agent.id;
  const currentAgent = agents.find((a) => a.id === currentAgentId) ?? job.agent;

  const isDirty =
    recurrence !== null || description !== null || agentId !== null;

  const cronDisplay = job.cronExpression;
  let cronHuman: string | null = null;
  if (cronDisplay) {
    try {
      cronHuman = cronstrue.toString(cronDisplay);
    } catch {
      // ignore parse errors
    }
  }

  async function handleSave() {
    if (!job) return;
    setSaving(true);
    setSaveError(null);
    try {
      const input: Record<string, string> = {};
      if (recurrence !== null) input.recurrence = recurrence;
      if (description !== null) input.description = description;
      if (agentId !== null) input.agentId = agentId;

      const result = await gql<UpdateAgentJobMutation>(UpdateAgentJobDoc, {
        id,
        input,
      });
      setSavedJob({
        ...job,
        ...result.updateAgentJob,
        tasks: job.tasks,
      } as Job);
      setRecurrence(null);
      setDescription(null);
      setAgentId(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <BackButton />

      {/* Header */}
      <div className="mt-4 flex items-center gap-3">
        <AgentAvatar id={currentAgent.id} />
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">{job.name}</h1>
          <Badge label={job.status} />
        </div>
      </div>

      {/* Agent Picker */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Agent
        </h2>
        <div className="flex items-center gap-3">
          <AgentAvatar id={currentAgent.id} size="sm" />
          <select
            value={currentAgentId}
            onChange={(e) => {
              const val = e.target.value;
              setAgentId(val === job.agent.id ? null : val);
            }}
            className="bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Schedule */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Schedule
        </h2>
        <input
          type="text"
          value={currentRecurrence}
          onChange={(e) => {
            const val = e.target.value;
            setRecurrence(val === job.recurrence ? null : val);
          }}
          className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          placeholder="e.g. every day, every hour, weekly..."
        />
        {cronDisplay && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-mono text-neutral-500">
              cron: {cronDisplay}
            </p>
            {cronHuman && (
              <p className="text-xs text-neutral-400">{cronHuman}</p>
            )}
          </div>
        )}
      </section>

      {/* Prompt */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Prompt
        </h2>
        <textarea
          value={currentDescription}
          onChange={(e) => {
            const val = e.target.value;
            setDescription(val === job.description ? null : val);
          }}
          rows={4}
          className="w-full bg-neutral-800 text-sm text-neutral-300 leading-relaxed rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500 resize-none"
        />
      </section>

      {/* Save */}
      {isDirty && (
        <div className="mt-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium text-white rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saveError && (
            <p className="mt-2 text-sm text-red-400">{saveError}</p>
          )}
        </div>
      )}

      {/* Run info */}
      <div className="mt-6 text-xs text-neutral-400">
        <p>
          Next run:{" "}
          <span className="text-neutral-300">{formatDate(job.nextRun)}</span>
        </p>
      </div>

      {/* Previous Runs */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Previous Runs
        </h2>
        {job.tasks.length === 0 ? (
          <p className="text-sm text-neutral-500">No previous runs yet.</p>
        ) : (
          <div className="divide-y divide-neutral-800 -mx-4">
            {job.tasks.map((t) => (
              <TaskCard key={t.id} item={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
