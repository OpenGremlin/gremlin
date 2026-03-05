import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkill } from "./getSkill.js";

/**
 * Toggle MCP tools on/off for a skill without uninstalling it.
 */
export async function setSkillMcpEnabled(
  ctx: ServiceContext,
  skillId: string,
  enabled: boolean,
): Promise<SkillItem> {
  await ctx.resources.ddb.entities.Skill.build(UpdateItemCommand)
    .item({ id: skillId, mcpEnabled: enabled })
    .send();

  const skill = await getSkill(ctx, skillId);
  if (!skill) throw new Error(`Skill ${skillId} not found`);
  return skill;
}
