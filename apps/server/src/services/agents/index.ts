import { getAgent } from "./getAgent.js";
import { getAgents } from "./getAgents.js";
import { updateAgent } from "./updateAgent.js";
import { updateAgentStatus } from "./updateAgentStatus.js";

export const agentService = {
  getAgents,
  getAgent,
  updateAgent,
  updateAgentStatus,
};

export type AgentService = typeof agentService;
