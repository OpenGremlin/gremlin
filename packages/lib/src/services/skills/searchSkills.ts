import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkills } from "./getSkills.js";
import { skillCatalog } from "./skillCatalog.js";

export async function searchSkills(
  ctx: ServiceContext,
  query: string,
): Promise<SkillItem[]> {
  const q = query.toLowerCase();

  // Filter catalog templates first
  const matchingIds = new Set(
    skillCatalog
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      )
      .map((t) => t.id),
  );

  // Then merge DDB state
  const all = await getSkills(ctx);
  return all.filter((s) => matchingIds.has(s.templateId));
}
