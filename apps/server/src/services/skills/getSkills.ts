import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { skillCatalog } from "./skillCatalog.js";

/**
 * Returns all skills from the catalog, merging in any persisted state
 * (installed, connectionBindings, etc.) from DynamoDB.
 */
export async function getSkills(ctx: ServiceContext): Promise<SkillItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Skill)
    .query({ partition: "SKILL" })
    .send();

  const dbMap = new Map(
    (Items ?? []).map((item) => [item.templateId, item]),
  );

  return skillCatalog.map((tmpl) => {
    const db = dbMap.get(tmpl.id);
    return {
      id: db?.id ?? tmpl.id,
      templateId: tmpl.id,
      installed: db?.installed ?? false,
      installedAt: db?.installedAt ?? null,
      connectionBindings: db?.connectionBindings ?? null,
      mcpEnabled: db?.mcpEnabled ?? null,
      configOverrides: db?.configOverrides ?? null,
    } satisfies SkillItem;
  });
}
