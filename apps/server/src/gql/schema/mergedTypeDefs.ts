import { mergeTypeDefs } from "@graphql-tools/merge";
import { agentTypeDefs } from "./Agent/typeDefs.js";
import { agentJobTypeDefs } from "./AgentJob/typeDefs.js";
import { agentLogTypeDefs } from "./AgentLog/typeDefs.js";
import { avatarTypeDefs } from "./Avatar/typeDefs.js";
import { baseTypeDefs } from "./base.js";
import { feedTypeDefs } from "./Feed/typeDefs.js";
import { integrationTypeDefs } from "./Integration/typeDefs.js";
import { notificationTypeDefs } from "./Notification/typeDefs.js";
import { profileTypeDefs } from "./Profile/typeDefs.js";
import { skillTypeDefs } from "./Skill/typeDefs.js";
import { taskTypeDefs } from "./Task/typeDefs.js";
import { taskFollowUpTypeDefs } from "./TaskFollowUp/typeDefs.js";

export const allTypeDefs = [
  baseTypeDefs,
  feedTypeDefs,
  agentJobTypeDefs,
  agentLogTypeDefs,
  agentTypeDefs,
  avatarTypeDefs,
  integrationTypeDefs,
  notificationTypeDefs,
  profileTypeDefs,
  skillTypeDefs,
  taskTypeDefs,
  taskFollowUpTypeDefs,
];

export const mergedTypeDefs = mergeTypeDefs(allTypeDefs);
