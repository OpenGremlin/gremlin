import { mergeResolvers } from "@graphql-tools/merge";
import { agentJobResolvers } from "./AgentJob/resolvers.js";
import { feedResolvers } from "./Feed/resolvers.js";
import { integrationResolvers } from "./Integration/resolvers.js";
import { skillResolvers } from "./Skill/resolvers.js";

export const mergedResolvers = mergeResolvers([
  feedResolvers,
  agentJobResolvers,
  integrationResolvers,
  skillResolvers,
]);
