import { getSkill } from "./getSkill.js";
import { getSkills } from "./getSkills.js";
import { installSkill } from "./installSkill.js";
import { searchSkills } from "./searchSkills.js";
import { uninstallSkill } from "./uninstallSkill.js";

export const skillService = {
  getSkills,
  getSkill,
  searchSkills,
  installSkill,
  uninstallSkill,
};

export type SkillService = typeof skillService;
