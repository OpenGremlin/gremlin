import { getActiveFollowUps } from "./getActiveFollowUps.js";
import { getTaskFollowUps } from "./getTaskFollowUps.js";

export const taskFollowUpService = { getActiveFollowUps, getTaskFollowUps };

export type TaskFollowUpService = typeof taskFollowUpService;
