import { mergeTypeDefs } from "@graphql-tools/merge";
import { agentTypeDefs } from "./Agent/typeDefs.js";
import { agentJobTypeDefs } from "./AgentJob/typeDefs.js";
import { avatarTypeDefs } from "./Avatar/typeDefs.js";
import { baseTypeDefs } from "./base.js";
import { feedTypeDefs } from "./Feed/typeDefs.js";
import { integrationTypeDefs } from "./Integration/typeDefs.js";
import { notificationTypeDefs } from "./Notification/typeDefs.js";
import { profileTypeDefs } from "./Profile/typeDefs.js";
import { skillTypeDefs } from "./Skill/typeDefs.js";

export const allTypeDefs = [
  baseTypeDefs,
  feedTypeDefs,
  agentJobTypeDefs,
  agentTypeDefs,
  avatarTypeDefs,
  integrationTypeDefs,
  notificationTypeDefs,
  profileTypeDefs,
  skillTypeDefs,
];

export const mergedTypeDefs = mergeTypeDefs(allTypeDefs);
