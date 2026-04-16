import type { SkillToolsResult } from "../../skills/buildSkillTools/index.js";
import type { loadAgentContext } from "../loadAgentContext.js";

/**
 * One row in the manager's team roster, pre-loaded once per drain loop.
 * Just enough for the manager's system prompt and the delegate tool's
 * ACL check — not the full agent record.
 */
export interface TeamMember {
  id: string;
  name: string;
  delegationHint?: string;
  role?: string;
  /**
   * Compact one-line summary of the member's installed skills + bound
   * connections, e.g. `slack (Acme), linear (Eng team), pdf-toolkit`.
   * Empty string when the member has no usable skills. This is the
   * single most important routing signal for the manager — generic
   * capability flags rarely differ between agents but installed
   * skills + their bound accounts almost always do.
   */
  skillBlurb: string;
}

/**
 * One row in the manager's "active delegations" view — open tasks the
 * manager has assigned to teammates that haven't been marked complete.
 * Fetched fresh each drain (no cache) because it changes as work flows.
 */
export interface ActiveDelegation {
  taskId: string;
  targetId: string;
  targetName: string;
  title: string;
}

/**
 * Per-agent context built once and shared across all lane invocations
 * (main lane + task lanes) within the same drain loop.
 */
export interface AgentLaneContext {
  agentId: string;
  agent: Awaited<ReturnType<typeof loadAgentContext>>["agent"];
  profile: Awaited<ReturnType<typeof loadAgentContext>>["profile"];
  displayName: string;
  timezone: string | undefined;
  skillSummary: { promptSection: string; mainLaneSection: string };
  skillTools: SkillToolsResult;
  modelSupportsImages: boolean;
  modelSupportsReasoning: boolean;
  imageModel: import("ai").ImageModel | null;
  speechModel: import("ai").SpeechModel | null;
  speechVoice: string | undefined;
  /** Connection ID string for the speech model (e.g. "openai:tts-1"). */
  speechConnectionId: string | undefined;
  /**
   * Resolved team roster when this agent has manager mode enabled.
   * Empty array for non-managers. Members that fail to load (deleted,
   * S3 hiccup) are silently dropped.
   */
  team: TeamMember[];
  /** Open tasks this agent has delegated to teammates. Empty for non-managers. */
  activeDelegations: ActiveDelegation[];
}
