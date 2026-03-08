import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkill } from "./getSkill.js";

export async function uninstallSkill(
  ctx: ServiceContext,
  id: string,
): Promise<SkillItem> {
  const skill = await getSkill(ctx, id);
  if (!skill) throw new Error(`Skill ${id} not found`);

  await ctx.resources.ddb.entities.Skill.build(DeleteItemCommand)
    .key({ id })
    .send();

  return { ...skill, installed: false };
}
