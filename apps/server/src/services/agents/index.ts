import { getAgent } from "./getAgent.js";
import { getAgents } from "./getAgents.js";
import { updateAgent } from "./updateAgent.js";

export const agentService = {
  getAgents,
  getAgent,
  updateAgent,
};

export type AgentService = typeof agentService;
