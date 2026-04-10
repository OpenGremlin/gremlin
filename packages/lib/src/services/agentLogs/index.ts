import { clearAgentLog } from "./clearAgentLog.js";
import { getAgentLogs } from "./getAgentLogs.js";
import { getChatLane } from "./getChatLane.js";
import { getTaskLogs } from "./getTaskLogs.js";

export const agentLogService = {
  clearAgentLog,
  getAgentLogs,
  getChatLane,
  getTaskLogs,
};

export type AgentLogService = typeof agentLogService;
