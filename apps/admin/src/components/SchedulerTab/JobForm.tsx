import { AgentAvatar } from "../../shared/AgentAvatar";

const TIMEZONES = Intl.supportedValuesOf("timeZone");

interface Agent {
  id: string;
  name: string;
}

export function JobForm({
  name,
  onNameChange,
  agentId,
  onAgentIdChange,
  agents,
  showAvatar,
  recurrence,
  onRecurrenceChange,
  timezone,
  onTimezoneChange,
  description,
  onDescriptionChange,
  children,
}: {
  name: string;
  onNameChange: (value: string) => void;
  agentId: string;
  onAgentIdChange: (value: string) => void;
  agents: Agent[];
  showAvatar?: boolean;
  recurrence: string;
  onRecurrenceChange: (value: string) => void;
  timezone: string;
  onTimezoneChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  children?: React.ReactNode;
}) {
  const currentAgent = agents.find((a) => a.id === agentId);

  return (
    <>
      {/* Job Name */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Job Name
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          placeholder="Job name"
        />
      </section>

      {/* Agent Picker */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Agent
        </h2>
        <div className="flex items-center gap-3">
          {showAvatar && currentAgent && <AgentAvatar id={currentAgent.id} />}
          <select
            value={agentId}
            onChange={(e) => onAgentIdChange(e.target.value)}
            className="bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          >
            {!showAvatar && <option value="">Default</option>}
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
          value={recurrence}
          onChange={(e) => onRecurrenceChange(e.target.value)}
          className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          placeholder="e.g. every day, every hour, weekly..."
        />
        {children}
      </section>

      {/* Timezone */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
          Timezone
        </h2>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500"
        >
          {TIMEZONES.map((tz) => (
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
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          className="w-full bg-neutral-800 text-sm text-neutral-300 leading-relaxed rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500 resize-none"
          placeholder="Describe what this job should do..."
        />
      </section>
    </>
  );
}
