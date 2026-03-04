import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "../../../auth";
import type { CreateAgentJobMutation } from "../../../graphql/generated/graphql";
import {
  AgentsQuery,
  CreateAgentJobMutation as CreateAgentJobDoc,
} from "../../../graphql/queries";
import { BackButton } from "../../../shared/BackButton";
import { useQuery } from "../../../useQuery";

export function NewJobPage() {
  const { data: agentsData } = useQuery(AgentsQuery);
  const agents = agentsData?.agents ?? [];

  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const canSubmit = name.trim() && recurrence.trim() && description.trim();

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const result = await gql<CreateAgentJobMutation>(CreateAgentJobDoc, {
        input: {
          name: name.trim(),
          description: description.trim(),
          recurrence: recurrence.trim(),
          timezone,
          agentId: agentId || undefined,
        },
      });
      navigate(`/settings/scheduler/${result.createAgentJob.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <BackButton />

      <h1 className="text-lg font-semibold text-neutral-100 mt-4 mb-6">
        New Job
      </h1>

      {/* Job Name */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Job Name
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          placeholder="Job name"
        />
      </section>

      {/* Agent Picker */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Agent
        </h2>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
        >
          <option value="">Default</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </section>

      {/* Schedule */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Schedule
        </h2>
        <input
          type="text"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          placeholder="e.g. every day, every hour, weekly..."
        />
      </section>

      {/* Timezone */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Timezone
        </h2>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
        >
          {Intl.supportedValuesOf("timeZone").map((tz) => (
            <option key={tz} value={tz}>
              {tz.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </section>

      {/* Description */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Job Description
        </h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full bg-neutral-800 text-sm text-neutral-300 leading-relaxed rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500 resize-none"
          placeholder="Describe what this job should do..."
        />
      </section>

      {/* Create */}
      <div className="mt-6">
        <button
          type="button"
          disabled={!canSubmit || saving}
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium text-white rounded-lg transition-colors"
        >
          {saving ? "Creating..." : "Create"}
        </button>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
