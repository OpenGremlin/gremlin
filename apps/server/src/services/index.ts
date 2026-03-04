import { type AgentLogService, agentLogService } from "./agentLogs/index.js";
import { type AgentService, agentService } from "./agents/index.js";
import { type GoogleService, googleService } from "./google/index.js";
import { type InboxService, inboxService } from "./inbox/index.js";
import {
  type IntegrationService,
  integrationService,
} from "./integrations/index.js";
import { type JobService, jobService } from "./jobs/index.js";
import { type MediaService, mediaService } from "./media/index.js";
import { type MemoryService, memoryService } from "./memory/index.js";
import {
  type ModelProviderService,
  modelProviderService,
} from "./modelProviders/index.js";
import {
  type NotificationService,
  notificationService,
} from "./notifications/index.js";
import { type OAuthService, oauthService } from "./oauth/index.js";
import {
  type OrchestratorService,
  orchestratorService,
} from "./orchestrator/index.js";
import { type ProfileService, profileService } from "./profile/index.js";
import { type SandboxService, sandboxService } from "./sandbox/index.js";
import { type SkillService, skillService } from "./skills/index.js";
import { type TaskService, taskService } from "./tasks/index.js";
import {
  type WorkspaceService,
  workspaceService,
} from "./workspace/index.js";

export interface Services {
  agentLogs: AgentLogService;
  agents: AgentService;
  google: GoogleService;
  inbox: InboxService;
  jobs: JobService;
  integrations: IntegrationService;
  notifications: NotificationService;
  oauth: OAuthService;

  profile: ProfileService;
  skills: SkillService;
  media: MediaService;
  memory: MemoryService;
  modelProviders: ModelProviderService;
  orchestrator: OrchestratorService;
  sandbox: SandboxService;
  tasks: TaskService;
  workspace: WorkspaceService;
}

export function createServices(): Services {
  return {
    agentLogs: agentLogService,
    agents: agentService,
    google: googleService,
    inbox: inboxService,
    jobs: jobService,
    integrations: integrationService,
    notifications: notificationService,
    oauth: oauthService,

    profile: profileService,
    skills: skillService,
    media: mediaService,
    memory: memoryService,
    modelProviders: modelProviderService,
    orchestrator: orchestratorService,
    sandbox: sandboxService,
    tasks: taskService,
    workspace: workspaceService,
  };
}
