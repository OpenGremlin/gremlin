import { mergeResolvers } from "@graphql-tools/merge";
import type { IResolvers } from "@graphql-tools/utils";
import { agentResolvers } from "./Agent/resolvers.js";
import { agentJobResolvers } from "./AgentJob/resolvers.js";
import { agentLogResolvers } from "./AgentLog/resolvers.js";
import { avatarResolvers } from "./Avatar/resolvers.js";
import { documentResolvers } from "./Document/resolvers.js";
import { integrationResolvers } from "./Integration/resolvers.js";

import { notificationResolvers } from "./Notification/resolvers.js";
import { profileResolvers } from "./Profile/resolvers.js";
import { skillResolvers } from "./Skill/resolvers.js";
import { taskResolvers } from "./Task/resolvers.js";

export const mergedResolvers: IResolvers = mergeResolvers([
  documentResolvers,
  agentJobResolvers,
  agentLogResolvers,
  agentResolvers,
  avatarResolvers,
  integrationResolvers,
  notificationResolvers,
  profileResolvers,
  skillResolvers,
  taskResolvers,
]);
