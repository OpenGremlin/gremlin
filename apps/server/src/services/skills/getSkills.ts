import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";

export async function getSkills(ctx: ServiceContext): Promise<SkillItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Skill)
    .query({ partition: "SKILL" })
    .send();

  return Items ?? [];
}
