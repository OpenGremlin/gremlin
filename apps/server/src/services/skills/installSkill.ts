import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkillTemplate } from "./skillCatalog.js";
import { getSkill } from "./getSkill.js";

export async function installSkill(
  ctx: ServiceContext,
  templateId: string,
): Promise<SkillItem> {
  const tmpl = getSkillTemplate(templateId);
  if (!tmpl) throw new Error(`Skill template ${templateId} not found in catalog`);

  await ctx.resources.ddb.entities.Skill.build(PutItemCommand)
    .item({
      id: templateId,
      templateId,
      installed: true,
      installedAt: new Date().toISOString(),
      mcpEnabled: true,
      connectionBindings: null,
      configOverrides: null,
    })
    .send();

  const skill = await getSkill(ctx, templateId);
  return skill!;
}
