import type { ServiceContext } from "../context.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import { getSkillTemplateFromS3 } from "./skillScanner.js";

export interface SkillConfigResult {
  skillInstructions: string[];
}

/**
 * Build skill configuration for an agent's task lane.
 * Loads the full SKILL.md body for each assigned skill and returns
 * the instructions to inject into the system prompt.
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

    if (template.instructions) {
      skillInstructions.push(
        `## ${template.name} Skill\n${template.instructions}`,
      );
    }
  }

  return { skillInstructions };
}
