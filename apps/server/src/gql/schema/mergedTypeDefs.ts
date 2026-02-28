import { mergeTypeDefs } from "@graphql-tools/merge";
import { agentJobTypeDefs } from "./AgentJob/typeDefs.js";
import { feedTypeDefs } from "./Feed/typeDefs.js";
import { integrationTypeDefs } from "./Integration/typeDefs.js";
import { skillTypeDefs } from "./Skill/typeDefs.js";
import { baseTypeDefs } from "./base.js";

export const allTypeDefs = [
  baseTypeDefs,
  feedTypeDefs,
  agentJobTypeDefs,
  integrationTypeDefs,
  skillTypeDefs,
];

export const mergedTypeDefs = mergeTypeDefs(allTypeDefs);
