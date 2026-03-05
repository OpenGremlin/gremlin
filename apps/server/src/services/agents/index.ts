import { createAgent } from "./createAgent.js";
import { getAgent } from "./getAgent.js";
import { getAgents } from "./getAgents.js";
import { updateAgent } from "./updateAgent.js";

export const agentService = {
  createAgent,
  getAgents,
  getAgent,
  updateAgent,
};

export type AgentService = typeof agentService;
