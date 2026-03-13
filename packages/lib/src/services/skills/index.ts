import { assignSkill } from "./assignSkill.js";
import { bindAgentSkillConnection } from "./bindAgentSkillConnection.js";
import { buildSkillConfig } from "./buildMcpConfig.js";
import { buildSkillTools } from "./buildSkillTools.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { removeSkill } from "./removeSkill.js";
import { resolveSkillEnv } from "./resolveSkillEnv.js";
import { unbindAgentSkillConnection } from "./unbindAgentSkillConnection.js";

export const skillService = {
  getAgentSkills,
  assignSkill,
  removeSkill,
  bindAgentSkillConnection,
  unbindAgentSkillConnection,
  buildSkillConfig,
  buildSkillTools,
  resolveSkillEnv,
};

export type SkillService = typeof skillService;
