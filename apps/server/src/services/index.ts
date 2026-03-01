import { type AgentService, agentService } from "./agents/index.js";
import { type FeedService, feedService } from "./feed/index.js";
import {
  type IntegrationService,
  integrationService,
} from "./integrations/index.js";
import { type JobService, jobService } from "./jobs/index.js";
import { type MediaService, mediaService } from "./media/index.js";
import {
  type NotificationService,
  notificationService,
} from "./notifications/index.js";
import { type ProfileService, profileService } from "./profile/index.js";
import { type SkillService, skillService } from "./skills/index.js";

export interface Services {
  agents: AgentService;
  jobs: JobService;
  feed: FeedService;
  integrations: IntegrationService;
  notifications: NotificationService;
  profile: ProfileService;
  skills: SkillService;
  media: MediaService;
}

export function createServices(): Services {
  return {
    agents: agentService,
    jobs: jobService,
    feed: feedService,
    integrations: integrationService,
    notifications: notificationService,
    profile: profileService,
    skills: skillService,
    media: mediaService,
  };
}
