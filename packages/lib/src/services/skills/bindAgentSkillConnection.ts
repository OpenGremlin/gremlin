import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { AgentSkillItem } from "../../resources/ddb/schema/agentSkill.js";
import type { ServiceContext } from "../context.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";

/**
 * Bind a connection to an agent skill's provider slot.
 */
export async function bindAgentSkillConnection(
  ctx: ServiceContext,
  agentId: string,
  skillId: string,
  providerId: string,
  connectionId: string,
): Promise<AgentSkillItem> {
  const { Item: existing } = await ctx.resources.ddb.entities.AgentSkill.build(
    GetItemCommand,
  )
    .key({ agentId, skillId })
    .send();

  if (!existing) {
    throw new Error(`Skill ${skillId} is not assigned to agent ${agentId}`);
  }

  const bindings = parseConnectionBindings(existing.connectionBindings);
  bindings[providerId] = connectionId;

  await ctx.resources.ddb.entities.AgentSkill.build(UpdateItemCommand)
    .item({
      agentId,
      skillId,
      connectionBindings: JSON.stringify(bindings),
    })
    .send();

  return { ...existing, connectionBindings: JSON.stringify(bindings) };
}
