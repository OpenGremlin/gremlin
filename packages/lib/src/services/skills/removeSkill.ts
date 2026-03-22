import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import type { ServiceContext } from "../context.js";
import { createAllowlistStore } from "../shellGuard/allowlistStore.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import { getSkillTemplateFromS3 } from "./skillScanner/index.js";

/**
 * Remove a skill assignment from an agent.
 * Also removes allowedCommands from the agent's shell guard allowlist,
 * unless another assigned skill still requires the same pattern.
 */
export async function removeSkill(
  ctx: ServiceContext,
  agentId: string,
  skillId: string,
): Promise<void> {
  const bucketName = getSkillsBucket();

  // Get the template for the skill being removed
  const template = await getSkillTemplateFromS3(bucketName, skillId);

  // Delete the skill assignment
  await ctx.resources.ddb.entities.AgentSkill.build(DeleteItemCommand)
    .key({ agentId, skillId })
    .send();

  // Remove allowedCommands that are no longer needed by any remaining skill
  if (template?.allowedCommands?.length) {
    // Collect patterns still needed by other assigned skills
    const remainingSkills = await getAgentSkills(ctx, agentId);
    const stillNeeded = new Set<string>();

    const otherTemplates = await Promise.all(
      remainingSkills
        .filter((s) => s.skillId !== skillId)
        .map((s) => getSkillTemplateFromS3(bucketName, s.skillId)),
    );

    for (const t of otherTemplates) {
      for (const cmd of t?.allowedCommands ?? []) {
        stillNeeded.add(cmd.toLowerCase());
      }
    }

    const store = createAllowlistStore(ctx);
    await Promise.all(
      template.allowedCommands
        .filter((pattern) => !stillNeeded.has(pattern.toLowerCase()))
        .map((pattern) => store.removeEntry(agentId, pattern)),
    );
  }
}
