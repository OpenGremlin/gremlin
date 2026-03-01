import { createFollowUp } from "./createFollowUp.js";
import { deactivateFollowUp } from "./deactivateFollowUp.js";
import { getActiveFollowUps } from "./getActiveFollowUps.js";
import { getTaskFollowUps } from "./getTaskFollowUps.js";

export const taskFollowUpService = {
  createFollowUp,
  deactivateFollowUp,
  getActiveFollowUps,
  getTaskFollowUps,
};

export type TaskFollowUpService = typeof taskFollowUpService;
