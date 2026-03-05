import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkill } from "./getSkill.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";

/**
 * Bind a connection to a skill's required connection slot.
 * Stores the mapping: providerId → connectionId as a JSON string.
 */
export async function bindSkillConnection(
  ctx: ServiceContext,
  skillId: string,
  providerId: string,
  connectionId: string,
): Promise<SkillItem> {
  const existing = await getSkill(ctx, skillId);
  if (!existing) throw new Error(`Skill ${skillId} not found`);

  const bindings = parseConnectionBindings(existing.connectionBindings);
  bindings[providerId] = connectionId;

  const { Attributes } = await ctx.resources.ddb.entities.Skill.build(
    UpdateItemCommand,
  )
    .item({ id: skillId, connectionBindings: JSON.stringify(bindings) })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Skill ${skillId} not found`);
  return Attributes;
}
