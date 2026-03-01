import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { ServiceContext } from "../context.js";
import { setSkillInstalled } from "./setSkillInstalled.js";

export async function installSkill(
  ctx: ServiceContext,
  id: string,
): Promise<SkillItem> {
  return setSkillInstalled(ctx, id, true);
}
