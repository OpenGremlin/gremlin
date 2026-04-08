import { assignSkill } from "./assignSkill.js";
import { bindAgentSkillConnection } from "./bindAgentSkillConnection.js";
import { buildSkillBlurb, buildSkillSummary } from "./buildSkillSummary.js";
import { buildSkillTools } from "./buildSkillTools.js";
import { getAgentSkills } from "./getAgentSkills.js";
import { getSkillsBucket } from "./getSkillsBucket.js";
import { removeSkill } from "./removeSkill.js";
import { resolveSkillEnv } from "./resolveSkillEnv.js";
import {
  getSkillTemplateFromS3,
  scanSkillCatalog,
} from "./skillScanner/index.js";
import { unbindAgentSkillConnection } from "./unbindAgentSkillConnection.js";

export const skillService = {
  getAgentSkills,
  getSkillsBucket,
  getSkillTemplateFromS3,
  scanSkillCatalog,
  assignSkill,
  removeSkill,
  bindAgentSkillConnection,
  unbindAgentSkillConnection,
  buildSkillBlurb,
  buildSkillSummary,
  buildSkillTools,
  resolveSkillEnv,
};

export type SkillService = typeof skillService;
