import { buildAgentLaneContext } from "./agentLaneContext.js";
import { runMainLane } from "./runMainLane.js";
import { runTaskLane } from "./runTaskLane.js";
import { sendMessage } from "./sendMessage.js";
import { writeAgentLog } from "./writeAgentLog.js";

export const orchestratorService = {
  buildAgentLaneContext,
  runMainLane,
  runTaskLane,
  sendMessage,
  writeAgentLog,
};

export type OrchestratorService = typeof orchestratorService;
