import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";

/**
 * Returns a single installed skill instance by its unique ID.
 * Returns null if no DB record exists.
 */
export async function getSkill(
  ctx: ServiceContext,
  id: string,
): Promise<SkillItem | null> {
  const { Item: db } = await ctx.resources.ddb.entities.Skill.build(GetItemCommand)
    .key({ id })
    .send();

  return db ?? null;
}
