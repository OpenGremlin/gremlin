import { mergeTypeDefs } from "@graphql-tools/merge";
import { agentTypeDefs } from "./Agent/typeDefs.js";
import { agentJobTypeDefs } from "./AgentJob/typeDefs.js";
import { agentLogTypeDefs } from "./AgentLog/typeDefs.js";
import { allowlistTypeDefs } from "./Allowlist/typeDefs.js";
import { attachmentTypeDefs } from "./Attachment/typeDefs.js";
import { avatarTypeDefs } from "./Avatar/typeDefs.js";
import { baseTypeDefs } from "./base.js";
import { commandApprovalTypeDefs } from "./CommandApproval/typeDefs.js";
import { fileTypeDefs } from "./File/typeDefs.js";
import { fileUploadTypeDefs } from "./FileUpload/typeDefs.js";
import { integrationTypeDefs } from "./Integration/typeDefs.js";
import { profileTypeDefs } from "./Profile/typeDefs.js";
import { settingsTypeDefs } from "./Settings/typeDefs.js";
import { skillTypeDefs } from "./Skill/typeDefs.js";
import { taskTypeDefs } from "./Task/typeDefs.js";
import { userInputRequestTypeDefs } from "./UserInputRequest/typeDefs.js";
import { workspaceTypeDefs } from "./Workspace/typeDefs.js";

export const allTypeDefs = [
  baseTypeDefs,
  allowlistTypeDefs,
  attachmentTypeDefs,
  fileTypeDefs,
  fileUploadTypeDefs,
  agentJobTypeDefs,
  agentLogTypeDefs,
  agentTypeDefs,
  avatarTypeDefs,
  commandApprovalTypeDefs,
  integrationTypeDefs,
  userInputRequestTypeDefs,
  profileTypeDefs,
  settingsTypeDefs,
  skillTypeDefs,
  taskTypeDefs,
  workspaceTypeDefs,
];

export const mergedTypeDefs = mergeTypeDefs(allTypeDefs);
