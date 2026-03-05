import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";

/**
 * Toggle MCP tools on/off for a skill without uninstalling it.
 */
export async function setSkillMcpEnabled(
  ctx: ServiceContext,
  skillId: string,
  enabled: boolean,
): Promise<SkillItem> {
  const { Attributes } = await ctx.resources.ddb.entities.Skill.build(
    UpdateItemCommand,
  )
    .item({ id: skillId, mcpEnabled: enabled })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Skill ${skillId} not found`);
  return Attributes;
}
