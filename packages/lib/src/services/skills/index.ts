import { assignSkill } from "./assignSkill.js";
import { bindAgentSkillConnection } from "./bindAgentSkillConnection.js";
import { buildSkillConfig } from "./buildMcpConfig.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { removeSkill } from "./removeSkill.js";
import { resolveSkillEnv } from "./resolveSkillEnv.js";

export const skillService = {
  getAgentSkills,
  assignSkill,
  removeSkill,
  bindAgentSkillConnection,
  buildSkillConfig,
  resolveSkillEnv,
};

export type SkillService = typeof skillService;
