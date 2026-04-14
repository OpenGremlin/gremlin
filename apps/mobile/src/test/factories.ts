/**
 * Mock data factories for Apollo Client testing.
 * Each factory returns a fully typed object with sensible defaults
 * and __typename fields for cache normalization.
 */
import {
  type Agent,
  type AgentConfig,
  type AgentJob,
  type AgentLog,
  type AgentLogRole,
  type CommandApproval,
  CommandApprovalStatus,
  type GlobalSettings,
  type Profile,
  type SkillTemplate,
  type Task,
  TaskStatus,
  type UserInputRequest,
  UserInputRequestStatus,
} from "../graphql/generated/graphql";

export function buildAgentConfig(
  overrides?: Partial<AgentConfig>,
): AgentConfig {
  return {
    __typename: "AgentConfig",
    model: null,
    imageModel: null,
    sandbox: {
      __typename: "AgentSandboxConfig",
      enabled: false,
      idleTimeoutMinutes: null,
      alwaysOn: null,
      commandApproval: "ask",
    },
    webSearch: {
      __typename: "AgentWebSearchConfig",
      enabled: false,
      provider: null,
    },
    reasoning: { __typename: "AgentReasoningConfig", enabled: false },
    viewImage: { __typename: "AgentViewImageConfig", enabled: false },
    imageGeneration: {
      __typename: "AgentImageGenerationConfig",
      enabled: false,
    },
    ...overrides,
  };
}

export function buildAgent(overrides?: Partial<Agent>): Agent {
  return {
    __typename: "Agent",
    id: "agent-1",
    name: "Test Agent",
    avatar: "default",
    portraitId: "portrait-1",
    imageUrl: "https://example.com/agent.png",
    personality: "A helpful test agent",
    role: null,
    retired: false,
    voiceEnabled: false,
    ttsVoice: null,
    config: buildAgentConfig(),
    ...overrides,
  };
}

export function buildAgentLog(overrides?: Partial<AgentLog>): AgentLog {
  return {
    __typename: "AgentLog",
    id: "log-1",
    agent: buildAgent(),
    role: "AGENT" as AgentLogRole,
    content: "Hello, how can I help?",
    toolName: null,
    toolInput: null,
    toolResult: null,
    commandApprovalId: null,
    attachments: [],
    taskId: null,
    createdAt: "2025-06-15T12:00:00Z",
    ...overrides,
  };
}

export function buildTask(overrides?: Partial<Task>): Task {
  return {
    __typename: "Task",
    id: "task-1",
    title: "Test Task",
    message: "Do something useful",
    createdAt: "2025-06-15T12:00:00Z",
    updatedAt: "2025-06-15T12:00:00Z",
    emoji: null,
    originJobId: null,
    status: TaskStatus.Open,
    priority: null,
    parentId: null,
    closedAt: null,
    closeReason: null,
    deferUntil: null,
    description: null,
    children: null,
    latestComment: null,
    assigneeName: null,
    attachments: [],
    logs: {
      __typename: "AgentLogConnection" as const,
      edges: [],
      pageInfo: {
        __typename: "AgentLogPageInfo" as const,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
    agent: buildAgent(),
    ...overrides,
  };
}

export function buildAgentJob(overrides?: Partial<AgentJob>): AgentJob {
  return {
    __typename: "AgentJob",
    id: "job-1",
    name: "Test Job",
    description: "A scheduled job",
    recurrence: "Every day at 9am",
    cronExpression: "0 9 * * *",
    timezone: "America/New_York",
    paused: false,
    lastRun: null,
    nextRun: "2025-06-16T13:00:00Z",
    tasks: [],
    agent: buildAgent(),
    ...overrides,
  };
}

export function buildCommandApproval(
  overrides?: Partial<CommandApproval>,
): CommandApproval {
  return {
    __typename: "CommandApproval",
    id: "approval-1",
    taskId: "task-1",
    command: "npm install",
    reason: "Requires approval",
    status: CommandApprovalStatus.Pending,
    decision: null,
    createdAt: "2025-06-15T12:00:00Z",
    agent: buildAgent(),
    ...overrides,
  };
}

export function buildUserInputRequest(
  overrides?: Partial<UserInputRequest>,
): UserInputRequest {
  return {
    __typename: "UserInputRequest",
    id: "input-1",
    turnId: null,
    message: "Should I proceed?",
    actions: [
      { __typename: "UserInputRequestAction", label: "Yes", style: "primary" },
      { __typename: "UserInputRequestAction", label: "No", style: "secondary" },
    ],
    status: UserInputRequestStatus.Pending,
    resolvedAction: null,
    createdAt: "2025-06-15T12:00:00Z",
    agent: buildAgent(),
    ...overrides,
  };
}

export function buildProfile(overrides?: Partial<Profile>): Profile {
  return {
    __typename: "Profile",
    displayName: "Test User",
    about: "A test user",
    website: null,
    timezone: "America/New_York",
    ...overrides,
  };
}

export function buildGlobalSettings(
  overrides?: Partial<GlobalSettings>,
): GlobalSettings {
  return {
    __typename: "GlobalSettings",
    signupDisabled: false,
    ...overrides,
  };
}

export function buildSkillTemplate(
  overrides?: Partial<SkillTemplate>,
): SkillTemplate {
  return {
    __typename: "SkillTemplate",
    id: "skill-1",
    name: "test-skill",
    displayName: "Test Skill",
    description: "A test skill",
    version: "1.0.0",
    author: "test",
    category: "general",
    icon: null,
    tags: [],
    hasInstall: false,
    install: null,
    allowedCommands: null,
    connections: [],
    ...overrides,
  };
}
