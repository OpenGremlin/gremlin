import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { getSkills } from "./getSkills.js";

export async function searchSkills(
  ctx: ServiceContext,
  query: string,
): Promise<SkillItem[]> {
  const all = await getSkills(ctx);
  const q = query.toLowerCase();
  return all.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q),
  );
}
