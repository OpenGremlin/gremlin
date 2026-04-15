import { type AgentLogService, agentLogService } from "./agentLogs/index.js";
import { type AgentService, agentService } from "./agents/index.js";
import { type InboxService, inboxService } from "./inbox/index.js";
import {
  type IntegrationService,
  integrationService,
} from "./integrations/index.js";
import { type JobService, jobService } from "./jobs/index.js";
import { type MediaService, mediaService } from "./media/index.js";
import { type MemoryService, memoryService } from "./memory/index.js";
import { type OAuthService, oauthService } from "./oauth/index.js";
import {
  type OrchestratorService,
  orchestratorService,
} from "./orchestrator/index.js";
import { type PostService, postService } from "./posts/index.js";
import { type ProfileService, profileService } from "./profile/index.js";
import { type SandboxService, sandboxService } from "./sandbox/index.js";
import {
  type ShellGuardService,
  shellGuardService,
} from "./shellGuard/index.js";
import { type SkillService, skillService } from "./skills/index.js";
import { type TaskService, taskService } from "./tasks/index.js";
import {
  type UserInputRequestService,
  userInputRequestService,
} from "./userInputRequests/index.js";
import { type WorkspaceService, workspaceService } from "./workspace/index.js";

export interface Services {
  agentLogs: AgentLogService;
  agents: AgentService;
  inbox: InboxService;
  jobs: JobService;
  integrations: IntegrationService;
  userInputRequests: UserInputRequestService;
  oauth: OAuthService;

  posts: PostService;
  profile: ProfileService;
  skills: SkillService;
  media: MediaService;
  memory: MemoryService;
  orchestrator: OrchestratorService;
  sandbox: SandboxService;
  shellGuard: ShellGuardService;
  tasks: TaskService;
  workspace: WorkspaceService;
}

export function createServices(): Services {
  return {
    agentLogs: agentLogService,
    agents: agentService,
    inbox: inboxService,
    jobs: jobService,
    integrations: integrationService,
    userInputRequests: userInputRequestService,
    oauth: oauthService,

    posts: postService,
    profile: profileService,
    skills: skillService,
    media: mediaService,
    memory: memoryService,
    orchestrator: orchestratorService,
    sandbox: sandboxService,
    shellGuard: shellGuardService,
    tasks: taskService,
    workspace: workspaceService,
  };
}
