import { mergeResolvers } from "@graphql-tools/merge";
import type { IResolvers } from "@graphql-tools/utils";
import { agentResolvers } from "./Agent/resolvers.js";
import { agentJobResolvers } from "./AgentJob/resolvers.js";
import { avatarResolvers } from "./Avatar/resolvers.js";
import { feedResolvers } from "./Feed/resolvers.js";
import { integrationResolvers } from "./Integration/resolvers.js";
import { skillResolvers } from "./Skill/resolvers.js";

export const mergedResolvers: IResolvers = mergeResolvers([
  feedResolvers,
  agentJobResolvers,
  agentResolvers,
  avatarResolvers,
  integrationResolvers,
  skillResolvers,
]);
