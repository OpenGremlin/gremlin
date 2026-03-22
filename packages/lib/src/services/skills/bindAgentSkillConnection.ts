import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { AgentSkillItem } from "../../resources/ddb/schema/agentSkill.js";
import type { ServiceContext } from "../context.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import { getSkillTemplateFromS3 } from "./skillScanner/index.js";

/**
 * Bind a connection to an agent skill's provider slot.
 * For multi-connection providers, appends to the array (deduplicated).
 * For single-connection providers, replaces with a single-element array.
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

  // Check if this provider supports multi-connection
  const template = await getSkillTemplateFromS3(getSkillsBucket(), skillId);
  const connDef = template?.connections?.find((c) => c.provider === providerId);
  const isMulti = connDef?.multi ?? false;

  if (isMulti) {
    const current = bindings[providerId] ?? [];
    if (!current.includes(connectionId)) {
      current.push(connectionId);
    }
    bindings[providerId] = current;
  } else {
    bindings[providerId] = [connectionId];
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
