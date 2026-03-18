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
  const skillEntries: string[] = [];

  for (const agentSkill of agentSkills) {
    const template = await getSkillTemplateFromS3(
      bucketName,
      agentSkill.skillId,
    );
    if (!template) continue;

    let entry = `- **${template.name}** (skillId: \`${template.id}\`): ${template.description}`;

    // List available connections
    if (template.connections?.length) {
      const rawBindings = parseConnectionBindings(
        agentSkill.connectionBindings,
      );
      const bindings = await filterRevokedBindings(ctx.resources, rawBindings);

      const connectionParts: string[] = [];
      for (const connReq of template.connections) {
        const boundIds = bindings[connReq.provider] ?? [];
        if (boundIds.length === 0) continue;

        const accounts = await loadActiveConnectionLabels(
          ctx.resources,
          boundIds,
        );
        if (accounts.length === 0) continue;

        for (const a of accounts) {
          connectionParts.push(
            `  - ${connReq.provider} (${a.label}):\n    \`authenticate('${template.id}', '${a.id}')\``,
          );
        }
      }

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
