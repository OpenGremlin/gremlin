import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";

export async function setSkillInstalled(
  ctx: ServiceContext,
  id: string,
  installed: boolean,
): Promise<SkillItem> {
  const { Attributes } = await ctx.resources.ddb.entities.Skill.build(
    UpdateItemCommand,
  )
    .item({ id, installed })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Skill ${id} not found`);
  return Attributes;
}
