import { getAgent } from "./getAgent.js";
import { getAgents } from "./getAgents.js";
import { updateAgentStatus } from "./updateAgentStatus.js";

export const agentService = { getAgents, getAgent, updateAgentStatus };

export type AgentService = typeof agentService;
