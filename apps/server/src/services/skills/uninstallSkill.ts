import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkill } from "./getSkill.js";

export async function uninstallSkill(
  ctx: ServiceContext,
  id: string,
): Promise<SkillItem> {
  await ctx.resources.ddb.entities.Skill.build(UpdateItemCommand)
    .item({ id, installed: false })
    .send();

  const skill = await getSkill(ctx, id);
  if (!skill) throw new Error(`Skill ${id} not found`);
  return skill;
}
