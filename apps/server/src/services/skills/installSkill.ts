import { randomUUID } from "node:crypto";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkill } from "./getSkill.js";
import { getSkillTemplate } from "./skillCatalog.js";

export async function installSkill(
  ctx: ServiceContext,
  templateId: string,
): Promise<SkillItem> {
  const tmpl = getSkillTemplate(templateId);
  if (!tmpl)
    throw new Error(`Skill template ${templateId} not found in catalog`);

  const id = randomUUID();

  await ctx.resources.ddb.entities.Skill.build(PutItemCommand)
    .item({
      id,
      templateId,
      installed: true,
      installedAt: new Date().toISOString(),
      mcpEnabled: true,
      connectionBindings: null,
      configOverrides: null,
    })
    .send();

  const skill = await getSkill(ctx, id);
  return skill!;
}
