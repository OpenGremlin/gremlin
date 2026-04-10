import { mergeResolvers } from "@graphql-tools/merge";
import type { IResolvers } from "@graphql-tools/utils";
import { agentResolvers } from "./Agent/resolvers.js";
import { agentJobResolvers } from "./AgentJob/resolvers.js";
import { agentLogResolvers } from "./AgentLog/resolvers.js";
import { allowlistResolvers } from "./Allowlist/resolvers.js";
import { attachmentResolvers } from "./Attachment/resolvers.js";
import { avatarResolvers } from "./Avatar/resolvers.js";
import { commandApprovalResolvers } from "./CommandApproval/resolvers.js";
import { fileResolvers } from "./File/resolvers.js";
import { fileUploadResolvers } from "./FileUpload/resolvers.js";
import { integrationResolvers } from "./Integration/resolvers.js";
import { logoResolvers } from "./Logo/resolvers.js";
import { profileResolvers } from "./Profile/resolvers.js";
import { settingsResolvers } from "./Settings/resolvers.js";
import { skillResolvers } from "./Skill/resolvers.js";
import { taskResolvers } from "./Task/resolvers.js";
import { userInputRequestResolvers } from "./UserInputRequest/resolvers.js";
import { workspaceResolvers } from "./Workspace/resolvers.js";

export const mergedResolvers: IResolvers = mergeResolvers([
  allowlistResolvers,
  attachmentResolvers,
  fileResolvers,
  fileUploadResolvers,
  agentJobResolvers,
  agentLogResolvers,
  agentResolvers,
  avatarResolvers,
  commandApprovalResolvers,
  integrationResolvers,
  logoResolvers,
  userInputRequestResolvers,
  profileResolvers,
  settingsResolvers,
  skillResolvers,
  taskResolvers,
  workspaceResolvers,
]);
