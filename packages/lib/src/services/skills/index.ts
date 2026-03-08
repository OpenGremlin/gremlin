import { bindSkillConnection } from "./bindSkillConnection.js";
import { buildMcpConfig } from "./buildMcpConfig.js";
import { getSkill } from "./getSkill.js";
import { getSkills } from "./getSkills.js";
import { installSkill } from "./installSkill.js";
import { resolveSkillEnv } from "./resolveSkillEnv.js";
import { searchSkills } from "./searchSkills.js";
import { setSkillMcpEnabled } from "./setSkillMcpEnabled.js";
import { uninstallSkill } from "./uninstallSkill.js";

export const skillService = {
  getSkills,
  getSkill,
  searchSkills,
  installSkill,
  uninstallSkill,
  bindSkillConnection,
  setSkillMcpEnabled,
  buildMcpConfig,
  resolveSkillEnv,
};

export type SkillService = typeof skillService;
