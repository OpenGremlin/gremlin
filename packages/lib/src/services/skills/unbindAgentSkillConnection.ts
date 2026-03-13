import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { AgentSkillItem } from "../../resources/ddb/schema/agentSkill.js";
import type { ServiceContext } from "../context.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";

/**
 * Remove a specific connectionId from a provider's bound connections.
 */
export async function unbindAgentSkillConnection(
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
  const current = bindings[providerId] ?? [];
  bindings[providerId] = current.filter((id) => id !== connectionId);

  // Remove the key entirely if empty
  if (bindings[providerId].length === 0) {
    delete bindings[providerId];
  }

  const serialized = JSON.stringify(bindings);

  await ctx.resources.ddb.entities.AgentSkill.build(UpdateItemCommand)
    .item({
      agentId,
      skillId,
      connectionBindings: serialized,
    })
    .send();

  return { ...existing, connectionBindings: serialized };
}
