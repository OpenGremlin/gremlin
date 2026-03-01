import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";

export async function getSkill(
  ctx: ServiceContext,
  id: string,
): Promise<SkillItem | null> {
  const { Item } = await ctx.resources.ddb.entities.Skill.build(GetItemCommand)
    .key({ id })
    .send();

  return Item ?? null;
}
