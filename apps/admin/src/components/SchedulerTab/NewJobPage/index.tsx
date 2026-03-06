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
import { JobForm } from "../JobForm";

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
      navigate(`/jobs/${result.createAgentJob.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <BackButton />

      <h1 className="text-lg font-semibold text-neutral-100 mt-4 mb-6">
        New Job
      </h1>

      <JobForm
        name={name}
        onNameChange={setName}
        agentId={agentId}
        onAgentIdChange={setAgentId}
        agents={agents}
        recurrence={recurrence}
        onRecurrenceChange={setRecurrence}
        timezone={timezone}
        onTimezoneChange={setTimezone}
        description={description}
        onDescriptionChange={setDescription}
      />

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
