import { type AgentLogService, agentLogService } from "./agentLogs/index.js";
import { type AgentService, agentService } from "./agents/index.js";
import {
  type IntegrationService,
  integrationService,
} from "./integrations/index.js";
import { type JobService, jobService } from "./jobs/index.js";
import { type MediaService, mediaService } from "./media/index.js";
import {
  type OrchestratorService,
  orchestratorService,
} from "./orchestrator/index.js";
import {
  type NotificationService,
  notificationService,
} from "./notifications/index.js";
import { type ProfileService, profileService } from "./profile/index.js";
import { type SkillService, skillService } from "./skills/index.js";
import {
  type TaskFollowUpService,
  taskFollowUpService,
} from "./taskFollowUps/index.js";
import {
  type DocumentService,
  documentService,
} from "./documents/index.js";
import { type TaskService, taskService } from "./tasks/index.js";

export interface Services {
  agentLogs: AgentLogService;
  agents: AgentService;
  documents: DocumentService;
  jobs: JobService;
  integrations: IntegrationService;
  notifications: NotificationService;
  profile: ProfileService;
  skills: SkillService;
  media: MediaService;
  orchestrator: OrchestratorService;
  tasks: TaskService;
  taskFollowUps: TaskFollowUpService;
}

export function createServices(): Services {
  return {
    agentLogs: agentLogService,
    agents: agentService,
    documents: documentService,
    jobs: jobService,
    integrations: integrationService,
    notifications: notificationService,
    profile: profileService,
    skills: skillService,
    media: mediaService,
    orchestrator: orchestratorService,
    tasks: taskService,
    taskFollowUps: taskFollowUpService,
  };
}
