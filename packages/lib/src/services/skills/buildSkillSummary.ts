import type { ServiceContext } from "../context.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import {
  filterRevokedBindings,
  loadActiveConnectionLabels,
} from "./loadActiveConnections.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import { getSkillTemplateFromS3 } from "./skillScanner.js";

export interface SkillSummaryResult {
  promptSection: string;
}

/**
 * Build a lightweight skill catalog for the system prompt.
 * Lists each skill with its name, description, and available connections.
 * The agent must call `readSkill` to get full instructions and auth.
 */
export async function buildSkillSummary(
  ctx: ServiceContext,
  agentId: string,
): Promise<SkillSummaryResult> {
  const agentSkills = await getAgentSkills(ctx, agentId);
  if (agentSkills.length === 0) {
    return { promptSection: "" };
  }

  const bucketName = getSkillsBucket();

  // Fetch all templates in parallel
  const templates = await Promise.all(
    agentSkills.map((s) => getSkillTemplateFromS3(bucketName, s.skillId)),
  );

  const skillEntries: string[] = [];

  for (let i = 0; i < agentSkills.length; i++) {
    const template = templates[i];
    if (!template) continue;

    const label = template.displayName ?? template.name;
    let entry = `- **${label}** (skillId: \`${template.id}\`): ${template.description}`;

    // List available connections
    if (template.connections?.length) {
      const rawBindings = parseConnectionBindings(
        agentSkills[i].connectionBindings,
      );
      const bindings = await filterRevokedBindings(ctx.resources, rawBindings);

      // Fetch all connection labels in parallel
      const connResults = await Promise.all(
        template.connections.map(async (connReq) => {
          const boundIds = bindings[connReq.provider] ?? [];
          if (boundIds.length === 0) return null;
          const accounts = await loadActiveConnectionLabels(
            ctx.resources,
            boundIds,
          );
          if (accounts.length === 0) return null;
          return accounts.map(
            (a) =>
              `  - ${connReq.provider} (${a.label}):\n    \`authenticate('${template.id}', '${a.id}')\``,
          );
        }),
      );

      const connectionParts = connResults.filter(Boolean).flat() as string[];

      if (connectionParts.length > 0) {
        entry += `\n  Available connections:\n${connectionParts.join("\n")}`;
      }
    }

    skillEntries.push(entry);
  }

  if (skillEntries.length === 0) {
    return { promptSection: "" };
  }

  const promptSection = `# Available Skills

Skills are CLI tools you use via \`runCommand\` in the sandbox. To use a skill:
1. Call \`readSkill(skillId)\` to get an overview and a list of available references.
2. Call \`readSkillReference(skillId, reference)\` to read detailed docs for a specific command. Only read what you need — don't load all references upfront. Example: \`readSkillReference("gmail", "send")\`
3. Call \`authenticate(skillId, connectionId)\` to set up auth tokens.
4. Run the skill's CLI commands via \`runCommand\`.

If you get auth errors, call \`authenticate\` again to refresh tokens.

${skillEntries.join("\n")}`;

  return { promptSection };
}
