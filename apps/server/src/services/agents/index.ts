import { getAgent } from "./getAgent.js";
import { getAgents } from "./getAgents.js";
import { resolveAgentStatus } from "./resolveAgentStatus.js";
import { updateAgent } from "./updateAgent.js";
import { updateAgentStatus } from "./updateAgentStatus.js";

export const agentService = {
  getAgents,
  getAgent,
  resolveAgentStatus,
  updateAgent,
  updateAgentStatus,
};

export type AgentService = typeof agentService;
