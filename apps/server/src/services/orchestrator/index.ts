import { dispatchDueFollowUps } from "./dispatchDueFollowUps.js";
import { dispatchDueJobs } from "./dispatchDueJobs.js";
import { recoverIncompleteTasks } from "./recoverIncompleteTasks.js";
import { runMainLane } from "./runMainLane.js";
import { runTaskLane } from "./runTaskLane.js";
import { sendMessage } from "./sendMessage.js";
import { startCron } from "./startCron.js";
import { writeAgentLog } from "./writeAgentLog.js";

export const orchestratorService = {
  runMainLane,
  runTaskLane,
  sendMessage,
  writeAgentLog,
  dispatchDueFollowUps,
  dispatchDueJobs,
  recoverIncompleteTasks,
  startCron,
};

export type OrchestratorService = typeof orchestratorService;
