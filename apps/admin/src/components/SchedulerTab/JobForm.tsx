import type { Agent as GqlAgent } from "../../graphql/generated/graphql";

type Agent = Pick<GqlAgent, "id" | "name">;

const TIMEZONES = Intl.supportedValuesOf("timeZone");

const labelClass = "text-xs font-medium text-neutral-400 mb-1.5 block";
const inputClass =
  "w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 border border-neutral-700 focus:outline-none focus:border-neutral-500";

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
  return (
    <>
      {/* Job Name */}
      <div>
        <label htmlFor="job-name" className={labelClass}>
          Job Name
        </label>
        <input
          id="job-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={inputClass}
          placeholder="Job name"
        />
      </div>

      {/* Agent Picker */}
      <div>
        <label htmlFor="job-agent" className={labelClass}>
          Agent
        </label>
        <select
          id="job-agent"
          value={agentId}
          onChange={(e) => onAgentIdChange(e.target.value)}
          className={inputClass}
        >
          {!showAvatar && <option value="">Default</option>}
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule + Timezone row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="job-schedule" className={labelClass}>
            Schedule
          </label>
          <input
            id="job-schedule"
            type="text"
            value={recurrence}
            onChange={(e) => onRecurrenceChange(e.target.value)}
            className={inputClass}
            placeholder="e.g. every day, weekly..."
          />
          {children}
        </div>
        <div>
          <label htmlFor="job-timezone" className={labelClass}>
            Timezone
          </label>
          <select
            id="job-timezone"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className={inputClass}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="job-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="job-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none leading-relaxed`}
          placeholder="Describe what this job should do..."
        />
      </div>
    </>
  );
}
