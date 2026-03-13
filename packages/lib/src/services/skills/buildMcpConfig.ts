import type { Resources } from "../../resources/index.js";
import type { ServiceContext } from "../context.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import { getSkillTemplateFromS3 } from "./skillScanner.js";

export interface SkillConfigResult {
  skillInstructions: string[];
}

/**
 * Build skill configuration for an agent's task lane.
 * Loads the full SKILL.md body for each assigned skill and returns
 * the instructions to inject into the system prompt.
 * For multi-connection skills, appends connection context.
 */
export async function buildSkillConfig(
  ctx: ServiceContext,
  agentId: string,
): Promise<SkillConfigResult> {
  const skillInstructions: string[] = [];

  const agentSkills = await getAgentSkills(ctx, agentId);
  if (agentSkills.length === 0) {
    return { skillInstructions };
  }

  const bucketName = getSkillsBucket();

  for (const agentSkill of agentSkills) {
    const template = await getSkillTemplateFromS3(
      bucketName,
      agentSkill.skillId,
    );
    if (!template) continue;

    let instruction = "";

    if (template.instructions) {
      instruction = `## ${template.name} Skill\n${template.instructions}`;
    }

    // Add multi-connection context if applicable
    if (template.connections?.length) {
      const bindings = parseConnectionBindings(agentSkill.connectionBindings);
      const multiSections: string[] = [];

      for (const connReq of template.connections) {
        if (!connReq.multi) continue;
        const boundIds = bindings[connReq.provider] ?? [];
        if (boundIds.length >= 2) {
          const accounts = await loadConnectionLabels(
            ctx.resources,
            boundIds,
          );
          const list = accounts
            .map((d) => `- **${d.id}**: ${d.label}`)
            .join("\n");
          multiSections.push(
            `### Available ${connReq.provider} accounts\n${list}\n\nUse the \`switch_${agentSkill.skillId}_${connReq.provider}\` tool to switch between accounts. The first account is used by default.`,
          );
        }
      }

      if (multiSections.length > 0) {
        instruction += "\n\n" + multiSections.join("\n\n");
      }
    }

    if (instruction) {
      skillInstructions.push(instruction);
    }
  }

  return { skillInstructions };
}

async function loadConnectionLabels(
  resources: Resources,
  connectionIds: string[],
): Promise<Array<{ id: string; label: string }>> {
  const { QueryCommand } = await import("dynamodb-toolbox/table/actions/query");
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  type ConnItem = {
    id: string;
    connectionMeta?: { accountId?: string };
  };
  const connMap = new Map((Items as ConnItem[]).map((c) => [c.id, c]));

  return connectionIds.map((id) => {
    const conn = connMap.get(id);
    const accountId = conn?.connectionMeta?.accountId;
    return {
      id,
      label: accountId && accountId !== "unknown" ? accountId : id,
    };
  });
}
