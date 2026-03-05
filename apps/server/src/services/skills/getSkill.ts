import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkillTemplate } from "./skillCatalog.js";

/**
 * Returns a single skill by ID (which equals templateId for now),
 * sourcing the template from the catalog and merging persisted state from DynamoDB.
 */
export async function getSkill(
  ctx: ServiceContext,
  id: string,
): Promise<SkillItem | null> {
  const tmpl = getSkillTemplate(id);
  if (!tmpl) return null;

  const { Item: db } = await ctx.resources.ddb.entities.Skill.build(GetItemCommand)
    .key({ id })
    .send();

  return {
    id: db?.id ?? tmpl.id,
    templateId: tmpl.id,
    installed: db?.installed ?? false,
    installedAt: db?.installedAt ?? null,
    connectionBindings: db?.connectionBindings ?? null,
    mcpEnabled: db?.mcpEnabled ?? null,
    configOverrides: db?.configOverrides ?? null,
  } satisfies SkillItem;
}
