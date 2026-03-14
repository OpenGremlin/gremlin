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
 * The agent must call `loadSkill` to get full instructions and auth.
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
            `  - ${connReq.provider} (${a.label}):\n    \`loadSkill('${template.id}', '${a.id}')\``,
          );
        }
      }

      if (connectionParts.length > 0) {
        entry += "\n  Available connections:\n" + connectionParts.join("\n");
      }
    }

    skillEntries.push(entry);
  }

  if (skillEntries.length === 0) {
    return { promptSection: "" };
  }

  const promptSection = `# Available Skills

Skills are CLI tools you can use via \`runCommand\` in the sandbox. Before using any skill, you MUST call \`loadSkill\` with the skillId (and optionally a connectionId) to set up authentication and get usage/install instructions.

If you encounter auth errors while using a skill, call \`refreshSkillAuth\` with the skillId and connectionId to get fresh tokens.

${skillEntries.join("\n")}`;

  return { promptSection };
}
