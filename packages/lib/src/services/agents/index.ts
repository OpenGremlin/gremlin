import { createAgent } from "./createAgent.js";
import { getAgent } from "./getAgent.js";
import { getAgents } from "./getAgents.js";
import { retireAgent } from "./retireAgent.js";
import { updateAgent } from "./updateAgent.js";

export const agentService = {
  createAgent,
  getAgents,
  getAgent,
  updateAgent,
  retireAgent,
};

export type AgentService = typeof agentService;
