import type { ServiceContext } from "../context.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import {
  filterRevokedBindings,
  loadActiveConnectionLabels,
} from "./loadActiveConnections.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import { getSkillTemplateFromS3 } from "./skillScanner/index.js";

export interface SkillSummaryResult {
  /**
   * Verbose, instruction-bearing summary for **task lanes**, where the
   * model has `readSkill` / `readSkillReference` / `authenticate` /
   * `runCommand` available and is expected to call them directly.
   */
  promptSection: string;
  /**
   * Compact, instruction-free summary for **main lanes**, which don't
   * have any of the skill-execution tools. Frames skills as capabilities
   * available via `backgroundTask` / `delegate` so the model uses them
   * for routing decisions instead of trying to call them directly.
   */
  mainLaneSection: string;
}

/**
 * One resolved skill, with its bound connections grouped by provider so
 * multi-binding skills render as `slack (Acme, Personal)` rather than
 * two separate entries. Each binding keeps both the connection id (for
 * the task-lane `authenticate(...)` hint) and the human label (for
 * routing decisions in main lanes and team rosters).
 */
interface ResolvedSkill {
  id: string;
  displayName: string;
  description: string;
  /** Empty when the skill requires no connections. */
  connectionsByProvider: Map<string, Array<{ id: string; label: string }>>;
  /** Connection requirements that exist on the template. */
  hasConnectionRequirements: boolean;
}

/**
 * Resolve every skill assigned to an agent into a structured form, ready
 * for either the task-lane or main-lane formatter. Shared by
 * `buildSkillSummary` and `buildSkillBlurb` so we only fetch once.
 */
async function resolveAgentSkills(
  ctx: ServiceContext,
  agentId: string,
): Promise<ResolvedSkill[]> {
  const agentSkills = await getAgentSkills(ctx, agentId);
  if (agentSkills.length === 0) return [];

  const bucketName = getSkillsBucket();
  const templates = await Promise.all(
    agentSkills.map((s) => getSkillTemplateFromS3(bucketName, s.skillId)),
  );

  const resolved: ResolvedSkill[] = [];
  for (let i = 0; i < agentSkills.length; i++) {
    const template = templates[i];
    if (!template) continue;

    const connectionsByProvider = new Map<
      string,
      Array<{ id: string; label: string }>
    >();
    const hasConnectionRequirements = !!template.connections?.length;

    if (hasConnectionRequirements) {
      const rawBindings = parseConnectionBindings(
        agentSkills[i].connectionBindings,
      );
      const bindings = await filterRevokedBindings(ctx.resources, rawBindings);

      for (const connReq of template.connections ?? []) {
        const boundIds = bindings[connReq.provider] ?? [];
        if (boundIds.length === 0) continue;
        const accounts = await loadActiveConnectionLabels(
          ctx.resources,
          boundIds,
        );
        if (accounts.length === 0) continue;
        connectionsByProvider.set(
          connReq.provider,
          accounts.map((a) => ({ id: a.id, label: a.label })),
        );
      }
    }

    resolved.push({
      id: template.id,
      displayName: template.displayName ?? template.name,
      description: template.description,
      connectionsByProvider,
      hasConnectionRequirements,
    });
  }

  return resolved;
}

/** Render the verbose task-lane format with full call instructions. */
function formatTaskLaneSection(skills: ResolvedSkill[]): string {
  if (skills.length === 0) return "";

  const entries: string[] = [];
  for (const skill of skills) {
    let entry = `- **${skill.displayName}** (skillId: \`${skill.id}\`): ${skill.description}`;

    if (skill.connectionsByProvider.size > 0) {
      const lines: string[] = [];
      for (const [provider, conns] of skill.connectionsByProvider) {
        for (const conn of conns) {
          lines.push(
            `  - ${provider} (${conn.label}):\n    \`authenticate('${skill.id}', '${conn.id}')\``,
          );
        }
      }
      entry += `\n  Available connections:\n${lines.join("\n")}`;
    }

    entries.push(entry);
  }

  return `# Available Skills

Skills are CLI tools you use via \`runCommand\` in the sandbox. To use a skill:
1. Call \`readSkill(skillId)\` to get an overview and a list of available references.
2. Call \`readSkillReference(skillId, reference)\` to read detailed docs for a specific command. Only read what you need — don't load all references upfront. Example: \`readSkillReference("gmail", "send")\`
3. Call \`authenticate(skillId, connectionId)\` to set up auth tokens.
4. Run the skill's CLI commands via \`runCommand\`.

If you get auth errors, call \`authenticate\` again to refresh tokens.

${entries.join("\n")}`;
}

/**
 * Render the main-lane format. Skills are framed as capabilities available
 * inside background tasks (or delegations) — NEVER as tools the main lane
 * can call directly. Drops all references to readSkill / runCommand /
 * authenticate so the model isn't tempted to invoke tools it doesn't have.
 *
 * Filters out skills that require connections but have none bound — they
 * effectively can't be used right now and listing them would mislead the
 * routing decision.
 */
function formatMainLaneSection(skills: ResolvedSkill[]): string {
  const usable = skills.filter(
    (s) => !s.hasConnectionRequirements || s.connectionsByProvider.size > 0,
  );
  if (usable.length === 0) return "";

  const entries = usable.map((skill) => {
    let line = `- **${skill.displayName}** (\`${skill.id}\`): ${skill.description}`;
    if (skill.connectionsByProvider.size > 0) {
      const parts: string[] = [];
      for (const [provider, conns] of skill.connectionsByProvider) {
        parts.push(`${provider} (${conns.map((c) => c.label).join(", ")})`);
      }
      line += `\n  Connections: ${parts.join(", ")}`;
    }
    return line;
  });

  return `# Available Skills

These skills are available inside your background tasks. You cannot call them directly from this conversation — to use one, call \`backgroundTask\` (or \`delegate\` to a teammate who has the right skill) and describe what you need done. Use this list to decide which requests need backgrounding or delegating.

${entries.join("\n")}`;
}

/**
 * Build the lightweight skill catalog for system prompts. Returns both the
 * task-lane (verbose, with call instructions) and main-lane (compact, no
 * instructions) variants from a single fetch.
 */
export async function buildSkillSummary(
  ctx: ServiceContext,
  agentId: string,
): Promise<SkillSummaryResult> {
  const skills = await resolveAgentSkills(ctx, agentId);
  return {
    promptSection: formatTaskLaneSection(skills),
    mainLaneSection: formatMainLaneSection(skills),
  };
}

/**
 * Compact one-line summary of an agent's installed skills + bound
 * connections, for use in another agent's manager-mode team roster.
 * Filters out skills with required-but-unbound connections so the
 * routing decision only sees what the teammate can actually do.
 *
 * Example output:
 *   `slack (Acme, Personal), linear (Eng team), github (marvinli), pdf-toolkit`
 *
 * Returns an empty string when the agent has no usable skills.
 */
export async function buildSkillBlurb(
  ctx: ServiceContext,
  agentId: string,
): Promise<string> {
  const skills = await resolveAgentSkills(ctx, agentId);
  const usable = skills.filter(
    (s) => !s.hasConnectionRequirements || s.connectionsByProvider.size > 0,
  );
  if (usable.length === 0) return "";

  return usable
    .map((skill) => {
      if (skill.connectionsByProvider.size === 0) {
        return skill.id;
      }
      // Collapse multiple bindings per provider: `slack (Acme, Personal)`.
      const parts: string[] = [];
      for (const conns of skill.connectionsByProvider.values()) {
        parts.push(...conns.map((c) => c.label));
      }
      return `${skill.id} (${parts.join(", ")})`;
    })
    .join(", ");
}
