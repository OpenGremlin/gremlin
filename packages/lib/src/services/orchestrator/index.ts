import { buildAgentLaneContext } from "./agentLaneContext/index.js";
import { dispatchTask } from "./dispatchTask.js";
import { resumeTaskLane } from "./resumeTaskLane.js";
import { runMainLane } from "./runMainLane.js";
import { runTaskLane } from "./runTaskLane.js";
import { sendMessage } from "./sendMessage.js";
import { writeAgentLog } from "./writeAgentLog.js";

export const orchestratorService = {
  buildAgentLaneContext,
  dispatchTask,
  resumeTaskLane,
  runMainLane,
  runTaskLane,
  sendMessage,
  writeAgentLog,
};

export type OrchestratorService = typeof orchestratorService;
