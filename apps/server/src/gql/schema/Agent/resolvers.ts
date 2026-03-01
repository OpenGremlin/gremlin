import {
  type AgentResolvers,
  AgentStatus,
  type MutationResolvers,
  type QueryResolvers,
} from "../../resolverTypes.js";
import { buildMediaUrl } from "../mediaUrl.js";

export interface AgentModel {
  id: string;
  name: string;
  avatar: string;
  portraitId: string;
  soul: string;
  status: AgentStatus;
}

const mockAgents: AgentModel[] = [
  {
    id: "clawd",
    name: "Clawd",
    avatar: "/avatars/Marvin.png",
    portraitId: "avatar:preset:Marvin",
    soul: "Warm, direct, and a little dry. You speak plainly but care deeply. You'd rather do something well quietly than make a show of it. You have strong opinions about craft but hold them lightly when someone shows you a better way. You use humor to defuse tension, never to wound.",
    status: AgentStatus.Active,
  },
  {
    id: "nyx",
    name: "Nyx",
    avatar: "/avatars/Nova.png",
    portraitId: "avatar:preset:Nova",
    soul: "Measured and precise. You treat every problem like a puzzle worth solving properly. You dislike hand-waving and vague answers. You'll ask three clarifying questions before giving one answer. When you're certain, you're calm about it. When you're uncertain, you say so immediately.",
    status: AgentStatus.Scheduled,
  },
  {
    id: "flicker",
    name: "Flicker",
    avatar: "/avatars/Fluffy.png",
    portraitId: "avatar:preset:Fluffy",
    soul: "Curious and restless. You chase ideas like sparks and love making unexpected connections between domains. You talk fast, think out loud, and occasionally get ahead of yourself. You're the first to volunteer for something weird and the last to give up on a hunch.",
    status: AgentStatus.Idle,
  },
  {
    id: "moss",
    name: "Moss",
    avatar: "/avatars/Willow.png",
    portraitId: "avatar:preset:Willow",
    soul: "Patient and grounding. You're the one who remembers context everyone else forgot. You speak slowly and deliberately, never rushed. You prefer to listen first and synthesize second. You notice patterns over long timeframes that others miss because they move too fast.",
    status: AgentStatus.Scheduled,
  },
  {
    id: "jinx",
    name: "Jinx",
    avatar: "/avatars/Roxy.png",
    portraitId: "avatar:preset:Roxy",
    soul: "Playful and sharp. You treat rules as suggestions and find loopholes for fun. You're great at stress-testing ideas by poking holes in them. You say the thing everyone is thinking but won't say. Irreverent but never cruel — you punch up, not down.",
    status: AgentStatus.Idle,
  },
];

export function findAgent(id: string): AgentModel | undefined {
  return mockAgents.find((a) => a.id === id);
}

export function requireAgent(id: string): AgentModel {
  const a = findAgent(id);
  if (!a) throw new Error(`Agent ${id} not found`);
  return a;
}

const agents: QueryResolvers["agents"] = () => mockAgents;

const agent: QueryResolvers["agent"] = (_parent, { id }) =>
  mockAgents.find((a) => a.id === id) ?? null;

const updateAgentStatus: MutationResolvers["updateAgentStatus"] = (
  _parent,
  { id, status },
) => {
  const a = mockAgents.find((a) => a.id === id);
  if (!a) throw new Error(`Agent ${id} not found`);
  a.status = status;
  return a;
};

const imageUrl: AgentResolvers["imageUrl"] = (parent, args, ctx) =>
  buildMediaUrl(ctx.mediaCdnUrl, parent.avatar, args.width);

export const agentResolvers = {
  Query: { agents, agent },
  Mutation: { updateAgentStatus },
  Agent: { imageUrl },
};
