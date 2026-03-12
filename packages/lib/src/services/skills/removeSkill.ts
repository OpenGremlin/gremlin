import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import type { ServiceContext } from "../context.js";

/**
 * Remove a skill assignment from an agent.
 */
export async function removeSkill(
  ctx: ServiceContext,
  agentId: string,
  skillId: string,
): Promise<void> {
  await ctx.resources.ddb.entities.AgentSkill.build(DeleteItemCommand)
    .key({ agentId, skillId })
    .send();
}
