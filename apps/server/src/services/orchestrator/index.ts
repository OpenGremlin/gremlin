import { createFollowUp } from "./createFollowUp.js";
import { createTask } from "./createTask.js";
import { deactivateFollowUp } from "./deactivateFollowUp.js";
import { dispatchDueFollowUps } from "./dispatchDueFollowUps.js";
import { recoverIncompleteTasks } from "./recoverIncompleteTasks.js";
import { runMainLane } from "./runMainLane.js";
import { runTaskLane } from "./runTaskLane.js";
import { sendMessage } from "./sendMessage.js";
import { startCron } from "./startCron.js";
import { updateTaskStatus } from "./updateTaskStatus.js";
import { writeAgentLog } from "./writeAgentLog.js";

export const orchestratorService = {
  runMainLane,
  runTaskLane,
  sendMessage,
  createTask,
  updateTaskStatus,
  createFollowUp,
  deactivateFollowUp,
  writeAgentLog,
  dispatchDueFollowUps,
  recoverIncompleteTasks,
  startCron,
};

export type OrchestratorService = typeof orchestratorService;
