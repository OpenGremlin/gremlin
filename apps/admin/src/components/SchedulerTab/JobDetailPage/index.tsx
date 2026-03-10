import cronstrue from "cronstrue";
import { Calendar, Clock, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../../../auth";
import type {
  AgentJobQuery as AgentJobQueryType,
  DeleteAgentJobMutation,
  UpdateAgentJobMutation,
} from "../../../graphql/generated/graphql";
import {
  AgentJobQuery,
  AgentsQuery,
  DeleteAgentJobMutation as DeleteAgentJobDoc,
  UpdateAgentJobMutation as UpdateAgentJobDoc,
} from "../../../graphql/queries";
import { useQuery } from "../../../hooks/useQuery";
import { useTitle } from "../../../hooks/useTitle";
import { clientLogger } from "../../../logger";
import { AgentAvatar } from "../../../shared/AgentAvatar";
import { BackButton } from "../../../shared/BackButton";
import { Badge } from "../../../shared/Badge";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { TaskCard } from "../../TasksTab/TaskCard";
import { JobForm } from "../JobForm";

type Job = NonNullable<AgentJobQueryType["agentJob"]>;

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(AgentJobQuery, { id: id ?? "" });
  const { data: agentsData } = useQuery(AgentsQuery);
  useTitle(data?.agentJob?.name ?? "Job");

  const [name, setName] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const navigate = useNavigate();

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
  const currentName = name ?? job.name;
  const currentRecurrence = recurrence ?? job.recurrence;
  const currentDescription = description ?? job.description;
  const currentAgentId = agentId ?? job.agent.id;
  const currentTimezone = timezone ?? job.timezone;

  const isDirty =
    name !== null ||
    recurrence !== null ||
    description !== null ||
    agentId !== null ||
    timezone !== null;

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
      if (name !== null) input.name = name;
      if (recurrence !== null) input.recurrence = recurrence;
      if (description !== null) input.description = description;
      if (agentId !== null) input.agentId = agentId;
      if (timezone !== null) input.timezone = timezone;

      clientLogger.info("Updating job", { jobId: id });
      const result = await gql<UpdateAgentJobMutation>(UpdateAgentJobDoc, {
        id,
        input,
      });
      setSavedJob({
        ...job,
        ...result.updateAgentJob,
        tasks: job.tasks,
      } as Job);
      setName(null);
      setRecurrence(null);
      setDescription(null);
      setAgentId(null);
      setTimezone(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      clientLogger.error("Failed to update job", { jobId: id, error: msg });
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <BackButton to="/jobs" label="Jobs" />

      {/* Header */}
      <div className="mt-4 flex items-center gap-4">
        <AgentAvatar id={job.agent.id} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-neutral-100 truncate">
              {job.name}
            </h1>
            <Badge label={job.status} />
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">{job.agent.name}</p>
        </div>
      </div>

      {/* Schedule summary card */}
      <div className="mt-6 bg-neutral-900 rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-neutral-500 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">Schedule</p>
            <p className="text-sm text-neutral-200">
              {cronHuman ?? job.recurrence}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-neutral-500 shrink-0" />
          <div>
            <p className="text-xs text-neutral-500">Next run</p>
            <p className="text-sm text-neutral-200">
              {formatDate(job.nextRun, "Not scheduled", currentTimezone)}
            </p>
          </div>
        </div>
        {cronDisplay && (
          <div>
            <p className="text-xs text-neutral-500">Cron</p>
            <p className="text-sm font-mono text-neutral-400">{cronDisplay}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={triggering}
          onClick={async () => {
            setTriggering(true);
            try {
              await gql(
                `mutation TriggerJob($id: ID!) { triggerJob(id: $id) }`,
                { id },
              );
              setTriggered(true);
              setTimeout(() => setTriggered(false), 3000);
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              clientLogger.error("Failed to trigger job", {
                jobId: id,
                error: msg,
              });
              setSaveError(msg);
            } finally {
              setTriggering(false);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
        >
          <Play size={14} />
          {triggering ? "Triggering..." : triggered ? "Triggered" : "Run now"}
        </button>
      </div>

      {/* Edit form */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-4">
          Configuration
        </h2>
        <div className="bg-neutral-900 rounded-xl p-5 space-y-5">
          <JobForm
            name={currentName}
            onNameChange={(val) => setName(val === job.name ? null : val)}
            agentId={currentAgentId}
            onAgentIdChange={(val) =>
              setAgentId(val === job.agent.id ? null : val)
            }
            agents={agents}
            recurrence={currentRecurrence}
            onRecurrenceChange={(val) =>
              setRecurrence(val === job.recurrence ? null : val)
            }
            timezone={currentTimezone}
            onTimezoneChange={(val) =>
              setTimezone(val === job.timezone ? null : val)
            }
            description={currentDescription}
            onDescriptionChange={(val) =>
              setDescription(val === job.description ? null : val)
            }
          />

          {isDirty && (
            <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium text-white rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(null);
                  setRecurrence(null);
                  setDescription(null);
                  setAgentId(null);
                  setTimezone(null);
                }}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Discard
              </button>
              {saveError && <p className="text-sm text-red-400">{saveError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
          History
        </h2>
        {job.tasks.length === 0 ? (
          <div className="bg-neutral-900 rounded-xl p-6 text-center">
            <p className="text-sm text-neutral-500">No previous runs yet.</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-xl overflow-hidden divide-y divide-neutral-800">
            {job.tasks.map((t) => (
              <TaskCard key={t.id} item={t} />
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-8 mb-4 pt-6 border-t border-neutral-800/60">
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            if (!window.confirm("Delete this job? This cannot be undone."))
              return;
            setDeleting(true);
            try {
              clientLogger.info("Deleting job", { jobId: id });
              await gql<DeleteAgentJobMutation>(DeleteAgentJobDoc, { id });
              navigate("/jobs");
            } catch (err) {
              clientLogger.error("Failed to delete job", {
                jobId: id,
                error: err instanceof Error ? err.message : String(err),
              });
              setDeleting(false);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 size={16} />
          {deleting ? "Deleting..." : "Delete Job"}
        </button>
      </div>
    </div>
  );
}
