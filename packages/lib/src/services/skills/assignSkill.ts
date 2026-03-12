import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { AgentSkillItem } from "../../resources/ddb/schema/agentSkill.js";
import type { ServiceContext } from "../context.js";

/**
 * Assign a skill to an agent with optional connection bindings.
 */
export async function assignSkill(
  ctx: ServiceContext,
  agentId: string,
  skillId: string,
  connectionBindings?: Record<string, string>,
): Promise<AgentSkillItem> {
  const item: AgentSkillItem = {
    agentId,
    skillId,
    connectionBindings: connectionBindings
      ? JSON.stringify(connectionBindings)
      : null,
    assignedAt: new Date().toISOString(),
  };

  await ctx.resources.ddb.entities.AgentSkill.build(PutItemCommand)
    .item(item)
    .send();

  return item;
}
