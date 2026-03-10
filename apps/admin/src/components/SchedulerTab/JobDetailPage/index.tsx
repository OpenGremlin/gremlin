import cronstrue from "cronstrue";
import { Play, Trash2 } from "lucide-react";
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
import { clientLogger } from "../../../logger";
import { BackButton } from "../../../shared/BackButton";
import { formatDate } from "../../../shared/formatDate";
import { NotFound, QueryResult } from "../../../shared/QueryResult";
import { TaskCard } from "../../TasksTab/TaskCard";
import { JobForm } from "../JobForm";

type Job = NonNullable<AgentJobQueryType["agentJob"]>;

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(AgentJobQuery, { id: id ?? "" });
  const { data: agentsData } = useQuery(AgentsQuery);

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
    <div className="p-6">
      <BackButton />

      <JobForm
        name={currentName}
        onNameChange={(val) => setName(val === job.name ? null : val)}
        agentId={currentAgentId}
        onAgentIdChange={(val) => setAgentId(val === job.agent.id ? null : val)}
        agents={agents}
        showAvatar
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
      >
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
      </JobForm>

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

      {/* Run now */}
      <div className="mt-4">
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

      {/* Run info */}
      <div className="mt-4 text-xs text-neutral-400">
        <p>
          Next run:{" "}
          <span className="text-neutral-300">
            {formatDate(job.nextRun, "Never", currentTimezone)}
          </span>
        </p>
      </div>

      {/* Previous Runs */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          History
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

      {/* Delete Job */}
      <section className="mt-8 mb-4">
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
          {deleting ? "Deleting…" : "Delete Job"}
        </button>
      </section>
    </div>
  );
}
