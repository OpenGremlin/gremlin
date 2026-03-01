import { getAgentLogs } from "./getAgentLogs.js";
import { getTaskLogs } from "./getTaskLogs.js";

export const agentLogService = { getAgentLogs, getTaskLogs };

export type AgentLogService = typeof agentLogService;
