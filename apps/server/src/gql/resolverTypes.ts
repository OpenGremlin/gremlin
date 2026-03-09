import { JobStatus } from '@gremlin/lib/enums.js';
import { NotificationStatus } from '@gremlin/lib/enums.js';
import { GraphQLResolveInfo } from 'graphql';
import { AgentItem } from '@gremlin/lib/resources/ddb/schema/agent.js';
import { AgentJobItem } from '@gremlin/lib/resources/ddb/schema/agentJob.js';
import { AgentLogItem } from '@gremlin/lib/resources/ddb/schema/agentLog.js';
import { AgentLogConnectionModel, AgentLogEdgeModel, PageInfoModel } from '@gremlin/lib/services/agentLogs/pagination.js';
import { AvatarModel } from './schema/Avatar/resolvers.js';
import { IntegrationProviderDef } from '@gremlin/lib/services/integrations/providers.js';
import { SafeIntegrationConnection } from '@gremlin/lib/services/integrations/getConnections.js';
import { DefaultModelResult } from '@gremlin/lib/services/integrations/getDefaultModel.js';
import { NotificationItem } from '@gremlin/lib/resources/ddb/schema/notification.js';
import { ProfileItem } from '@gremlin/lib/resources/ddb/schema/profile.js';
import { SkillItem } from '@gremlin/lib/resources/ddb/schema/skill.js';
import { SkillTemplate as SkillTemplateModel } from '@gremlin/lib/services/skills/registry.js';
import { TaskItem } from '@gremlin/lib/resources/ddb/schema/task.js';
import { TaskConnectionModel, TaskEdgeModel, TaskPageInfoModel } from '@gremlin/lib/services/tasks/pagination.js';
import { GremlinContext } from './context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type EnumResolverSignature<T, AllowedValues = any> = { [key in keyof T]?: AllowedValues };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Agent = {
  __typename?: 'Agent';
  avatar: Scalars['String']['output'];
  config?: Maybe<AgentConfig>;
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  portraitId: Scalars['String']['output'];
  retired: Scalars['Boolean']['output'];
  soul: Scalars['String']['output'];
  ttsVoice?: Maybe<Scalars['String']['output']>;
};


export type AgentImageUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type AgentConfig = {
  __typename?: 'AgentConfig';
  model?: Maybe<AgentModelConfig>;
  sandbox?: Maybe<AgentSandboxConfig>;
  webSearch?: Maybe<AgentWebSearchConfig>;
};

export type AgentConfigInput = {
  model?: InputMaybe<AgentModelConfigInput>;
  sandbox?: InputMaybe<AgentSandboxConfigInput>;
  webSearch?: InputMaybe<AgentWebSearchConfigInput>;
};

export type AgentJob = {
  __typename?: 'AgentJob';
  agent: Agent;
  cronExpression?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastRun?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nextRun?: Maybe<Scalars['String']['output']>;
  recurrence: Scalars['String']['output'];
  status: JobStatus;
  tasks: Array<Task>;
  timezone: Scalars['String']['output'];
};

export type AgentLog = {
  __typename?: 'AgentLog';
  agent: Agent;
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  role: AgentLogRole;
  taskId?: Maybe<Scalars['String']['output']>;
  toolInput?: Maybe<Scalars['String']['output']>;
  toolName?: Maybe<Scalars['String']['output']>;
  toolResult?: Maybe<Scalars['String']['output']>;
};

export type AgentLogConnection = {
  __typename?: 'AgentLogConnection';
  edges: Array<AgentLogEdge>;
  pageInfo: AgentLogPageInfo;
};

export type AgentLogEdge = {
  __typename?: 'AgentLogEdge';
  cursor: Scalars['String']['output'];
  node: AgentLog;
};

export type AgentLogPageInfo = {
  __typename?: 'AgentLogPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export enum AgentLogRole {
  Agent = 'AGENT',
  System = 'SYSTEM',
  Tool = 'TOOL',
  User = 'USER'
}

export type AgentModelConfig = {
  __typename?: 'AgentModelConfig';
  connectionId?: Maybe<Scalars['String']['output']>;
  modelId?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type AgentModelConfigInput = {
  connectionId?: InputMaybe<Scalars['String']['input']>;
  modelId?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type AgentSandboxConfig = {
  __typename?: 'AgentSandboxConfig';
  alwaysOn?: Maybe<Scalars['Boolean']['output']>;
  enabled: Scalars['Boolean']['output'];
  idleTimeoutMinutes?: Maybe<Scalars['Int']['output']>;
};

export type AgentSandboxConfigInput = {
  alwaysOn?: InputMaybe<Scalars['Boolean']['input']>;
  enabled: Scalars['Boolean']['input'];
  idleTimeoutMinutes?: InputMaybe<Scalars['Int']['input']>;
};

export type AgentWebSearchConfig = {
  __typename?: 'AgentWebSearchConfig';
  enabled: Scalars['Boolean']['output'];
  provider?: Maybe<Scalars['String']['output']>;
};

export type AgentWebSearchConfigInput = {
  enabled: Scalars['Boolean']['input'];
  provider?: InputMaybe<Scalars['String']['input']>;
};

export type ApiKeyConnectionMeta = {
  __typename?: 'ApiKeyConnectionMeta';
  accountId?: Maybe<Scalars['String']['output']>;
};

export type AvailableScope = {
  __typename?: 'AvailableScope';
  label: Scalars['String']['output'];
  scope: Scalars['String']['output'];
};

export type Avatar = {
  __typename?: 'Avatar';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  url: Scalars['String']['output'];
};


export type AvatarUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type CompleteFileUploadInput = {
  agentId: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  key: Scalars['String']['input'];
  sizeBytes: Scalars['Int']['input'];
  taskId?: InputMaybe<Scalars['String']['input']>;
};

export type CompletedFileUpload = {
  __typename?: 'CompletedFileUpload';
  contentType: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  path: Scalars['String']['output'];
  sizeBytes: Scalars['Int']['output'];
};

export type ConnectionMeta = ApiKeyConnectionMeta | OAuthConnectionMeta;

export type CreateAgentInput = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  soul?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAgentJobInput = {
  agentId?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  recurrence: Scalars['String']['input'];
  timezone: Scalars['String']['input'];
};

export type DefaultModel = {
  __typename?: 'DefaultModel';
  modelId: Scalars['String']['output'];
  providerId: Scalars['String']['output'];
};

export type Document = {
  __typename?: 'Document';
  body?: Maybe<Scalars['String']['output']>;
  path: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type FileUploadRequest = {
  contentType: Scalars['String']['input'];
  filename: Scalars['String']['input'];
  sizeBytes: Scalars['Int']['input'];
};

export type FileUploadUrl = {
  __typename?: 'FileUploadUrl';
  key: Scalars['String']['output'];
  presignedUrl: Scalars['String']['output'];
  uploadId: Scalars['String']['output'];
};

export type GlobalSettings = {
  __typename?: 'GlobalSettings';
  signupDisabled: Scalars['Boolean']['output'];
};

export type IntegrationConnection = {
  __typename?: 'IntegrationConnection';
  connectedAt: Scalars['String']['output'];
  connectionType: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isRevoked: Scalars['Boolean']['output'];
  meta: ConnectionMeta;
  providerId: Scalars['String']['output'];
};

export type IntegrationProvider = {
  __typename?: 'IntegrationProvider';
  availableScopes: Array<AvailableScope>;
  category: Scalars['String']['output'];
  connectionCount: Scalars['Int']['output'];
  connectionType: Scalars['String']['output'];
  description: Scalars['String']['output'];
  hasConnection: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  models?: Maybe<Array<ModelInfo>>;
  service: Scalars['String']['output'];
};

export { JobStatus };

export type ModelInfo = {
  __typename?: 'ModelInfo';
  contextWindow: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  inputCost?: Maybe<Scalars['Float']['output']>;
  maxTokens: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  outputCost?: Maybe<Scalars['Float']['output']>;
  reasoning: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  bindSkillConnection?: Maybe<Skill>;
  completeFileUpload: CompletedFileUpload;
  connectApiKey: Scalars['ID']['output'];
  createAgent: Agent;
  createAgentJob: AgentJob;
  deleteAgentJob?: Maybe<AgentJob>;
  disableBedrockModel: Scalars['Boolean']['output'];
  dismissNotification?: Maybe<Notification>;
  enableBedrockModel: Scalars['Boolean']['output'];
  installSkill?: Maybe<Skill>;
  renameIntegrationConnection: Scalars['Boolean']['output'];
  requestFileUploads: Array<FileUploadUrl>;
  resolveNotification?: Maybe<Notification>;
  retireAgent: Agent;
  revokeIntegrationConnection: Scalars['Boolean']['output'];
  sendMessage: SendMessageResult;
  setDefaultModel: Scalars['Boolean']['output'];
  setSkillMcpEnabled?: Maybe<Skill>;
  submitOAuthConnection: Scalars['ID']['output'];
  uninstallSkill?: Maybe<Skill>;
  updateAgent?: Maybe<Agent>;
  updateAgentJob?: Maybe<AgentJob>;
  updateGlobalSettings: GlobalSettings;
  updateJobStatus?: Maybe<AgentJob>;
  updateProfile: Profile;
};


export type MutationBindSkillConnectionArgs = {
  connectionId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
  providerId: Scalars['String']['input'];
};


export type MutationCompleteFileUploadArgs = {
  input: CompleteFileUploadInput;
};


export type MutationConnectApiKeyArgs = {
  apiKey: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
};


export type MutationCreateAgentArgs = {
  input: CreateAgentInput;
};


export type MutationCreateAgentJobArgs = {
  input: CreateAgentJobInput;
};


export type MutationDeleteAgentJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDisableBedrockModelArgs = {
  modelId: Scalars['String']['input'];
};


export type MutationDismissNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEnableBedrockModelArgs = {
  modelId: Scalars['String']['input'];
};


export type MutationInstallSkillArgs = {
  templateId: Scalars['ID']['input'];
};


export type MutationRenameIntegrationConnectionArgs = {
  description: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationRequestFileUploadsArgs = {
  agentId: Scalars['String']['input'];
  files: Array<FileUploadRequest>;
  taskId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationResolveNotificationArgs = {
  actionId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationRetireAgentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRevokeIntegrationConnectionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSendMessageArgs = {
  agentId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  taskId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetDefaultModelArgs = {
  modelId: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
};


export type MutationSetSkillMcpEnabledArgs = {
  enabled: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
};


export type MutationSubmitOAuthConnectionArgs = {
  accessToken: Scalars['String']['input'];
  accountId?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  providerId: Scalars['String']['input'];
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  scopes: Array<Scalars['String']['input']>;
};


export type MutationUninstallSkillArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAgentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAgentInput;
};


export type MutationUpdateAgentJobArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAgentJobInput;
};


export type MutationUpdateGlobalSettingsArgs = {
  signupDisabled?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUpdateJobStatusArgs = {
  id: Scalars['ID']['input'];
  status: JobStatus;
};


export type MutationUpdateProfileArgs = {
  input: ProfileInput;
};

export type Notification = {
  __typename?: 'Notification';
  actions: Array<NotificationAction>;
  agent: Agent;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  resolvedAction?: Maybe<Scalars['String']['output']>;
  status: NotificationStatus;
  turnId?: Maybe<Scalars['String']['output']>;
  type: NotificationType;
};

export type NotificationAction = {
  __typename?: 'NotificationAction';
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
  style: Scalars['String']['output'];
};

export { NotificationStatus };

export enum NotificationType {
  Approval = 'APPROVAL',
  Permission = 'PERMISSION'
}

export type OAuthConnectionMeta = {
  __typename?: 'OAuthConnectionMeta';
  accountId?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['String']['output']>;
  scopes: Array<Scalars['String']['output']>;
};

export type Profile = {
  __typename?: 'Profile';
  about: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  timezone?: Maybe<Scalars['String']['output']>;
  website?: Maybe<Scalars['String']['output']>;
};

export type ProfileInput = {
  about: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
  timezone?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  agent?: Maybe<Agent>;
  agentJob?: Maybe<AgentJob>;
  agentJobs: Array<AgentJob>;
  agentLogs: AgentLogConnection;
  agents: Array<Agent>;
  avatars: Array<Avatar>;
  bedrockEnabledModels: Array<Scalars['String']['output']>;
  defaultModel?: Maybe<DefaultModel>;
  globalSettings: GlobalSettings;
  integrationConnections: Array<IntegrationConnection>;
  integrationProviders: Array<IntegrationProvider>;
  notifications: Array<Notification>;
  profile: Profile;
  skill?: Maybe<Skill>;
  skillTemplate?: Maybe<SkillTemplate>;
  /** All templates from the catalog */
  skillTemplates: Array<SkillTemplate>;
  /** All installed skill instances */
  skills: Array<Skill>;
  task?: Maybe<Task>;
  taskLogs: AgentLogConnection;
  tasks: TaskConnection;
  workspaceEntries: Array<WorkspaceEntry>;
  workspaceFile?: Maybe<Scalars['String']['output']>;
};


export type QueryAgentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentLogsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  agentId: Scalars['ID']['input'];
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySkillArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySkillTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskLogsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  taskId: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWorkspaceEntriesArgs = {
  path: Scalars['String']['input'];
};


export type QueryWorkspaceFileArgs = {
  path: Scalars['String']['input'];
};

export type SandboxOutput = {
  __typename?: 'SandboxOutput';
  commandId: Scalars['String']['output'];
  data: Scalars['String']['output'];
  done?: Maybe<Scalars['Boolean']['output']>;
  exitCode?: Maybe<Scalars['Int']['output']>;
  stream: Scalars['String']['output'];
};

export type SendMessageResult = {
  __typename?: 'SendMessageResult';
  content: Scalars['String']['output'];
  queued: Scalars['Boolean']['output'];
};

export type Skill = {
  __typename?: 'Skill';
  id: Scalars['ID']['output'];
  installed: Scalars['Boolean']['output'];
  installedAt?: Maybe<Scalars['String']['output']>;
  mcpEnabled?: Maybe<Scalars['Boolean']['output']>;
  requiredConnections: Array<SkillConnectionStatus>;
  template: SkillTemplate;
};

export type SkillConnectionRequirement = {
  __typename?: 'SkillConnectionRequirement';
  optional: Scalars['Boolean']['output'];
  providerId: Scalars['String']['output'];
  providerName: Scalars['String']['output'];
  reason: Scalars['String']['output'];
};

export type SkillConnectionStatus = {
  __typename?: 'SkillConnectionStatus';
  boundConnectionId?: Maybe<Scalars['String']['output']>;
  connected: Scalars['Boolean']['output'];
  optional: Scalars['Boolean']['output'];
  providerId: Scalars['String']['output'];
  providerName: Scalars['String']['output'];
  reason: Scalars['String']['output'];
};

export type SkillTemplate = {
  __typename?: 'SkillTemplate';
  author: Scalars['String']['output'];
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  hasInstructions: Scalars['Boolean']['output'];
  hasMcp: Scalars['Boolean']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  installCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  requiredConnections: Array<SkillConnectionRequirement>;
  version: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  _empty?: Maybe<Scalars['String']['output']>;
  agentLogCreated: AgentLog;
  agentUpdated: Agent;
  agentsUpdated: Agent;
  sandboxOutput: SandboxOutput;
  taskLogCreated: AgentLog;
  taskUpdated: Task;
  tasksUpdated: Task;
};


export type SubscriptionAgentLogCreatedArgs = {
  agentId: Scalars['ID']['input'];
};


export type SubscriptionAgentUpdatedArgs = {
  agentId: Scalars['ID']['input'];
};


export type SubscriptionAgentsUpdatedArgs = {
  agentIds: Array<Scalars['ID']['input']>;
};


export type SubscriptionSandboxOutputArgs = {
  taskId: Scalars['ID']['input'];
};


export type SubscriptionTaskLogCreatedArgs = {
  taskId: Scalars['ID']['input'];
};


export type SubscriptionTaskUpdatedArgs = {
  taskId: Scalars['ID']['input'];
};


export type SubscriptionTasksUpdatedArgs = {
  taskIds: Array<Scalars['ID']['input']>;
};

export type Task = {
  __typename?: 'Task';
  agent: Agent;
  artifacts: Array<Scalars['String']['output']>;
  completedAt?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  documents: Array<Document>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  logs: AgentLogConnection;
  message?: Maybe<Scalars['String']['output']>;
  originJobId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};


export type TaskImageUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
};


export type TaskLogsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type TaskConnection = {
  __typename?: 'TaskConnection';
  edges: Array<TaskEdge>;
  pageInfo: TaskPageInfo;
};

export type TaskEdge = {
  __typename?: 'TaskEdge';
  cursor: Scalars['String']['output'];
  node: Task;
};

export type TaskPageInfo = {
  __typename?: 'TaskPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type UpdateAgentInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  config?: InputMaybe<AgentConfigInput>;
  name?: InputMaybe<Scalars['String']['input']>;
  soul?: InputMaybe<Scalars['String']['input']>;
  ttsVoice?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAgentJobInput = {
  agentId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  recurrence?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type WorkspaceEntry = {
  __typename?: 'WorkspaceEntry';
  isDirectory: Scalars['Boolean']['output'];
  mimeType?: Maybe<Scalars['String']['output']>;
  modifiedAt?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  size?: Maybe<Scalars['Int']['output']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping of union types */
export type ResolversUnionTypes<_RefType extends Record<string, unknown>> = {
  ConnectionMeta:
    | ( ApiKeyConnectionMeta )
    | ( OAuthConnectionMeta )
  ;
};


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Agent: ResolverTypeWrapper<AgentItem>;
  AgentConfig: ResolverTypeWrapper<AgentConfig>;
  AgentConfigInput: AgentConfigInput;
  AgentJob: ResolverTypeWrapper<AgentJobItem>;
  AgentLog: ResolverTypeWrapper<AgentLogItem>;
  AgentLogConnection: ResolverTypeWrapper<AgentLogConnectionModel>;
  AgentLogEdge: ResolverTypeWrapper<AgentLogEdgeModel>;
  AgentLogPageInfo: ResolverTypeWrapper<PageInfoModel>;
  AgentLogRole: AgentLogRole;
  AgentModelConfig: ResolverTypeWrapper<AgentModelConfig>;
  AgentModelConfigInput: AgentModelConfigInput;
  AgentSandboxConfig: ResolverTypeWrapper<AgentSandboxConfig>;
  AgentSandboxConfigInput: AgentSandboxConfigInput;
  AgentWebSearchConfig: ResolverTypeWrapper<AgentWebSearchConfig>;
  AgentWebSearchConfigInput: AgentWebSearchConfigInput;
  ApiKeyConnectionMeta: ResolverTypeWrapper<ApiKeyConnectionMeta>;
  AvailableScope: ResolverTypeWrapper<AvailableScope>;
  Avatar: ResolverTypeWrapper<AvatarModel>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CompleteFileUploadInput: CompleteFileUploadInput;
  CompletedFileUpload: ResolverTypeWrapper<CompletedFileUpload>;
  ConnectionMeta: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ConnectionMeta']>;
  CreateAgentInput: CreateAgentInput;
  CreateAgentJobInput: CreateAgentJobInput;
  DefaultModel: ResolverTypeWrapper<DefaultModelResult>;
  Document: ResolverTypeWrapper<Document>;
  FileUploadRequest: FileUploadRequest;
  FileUploadUrl: ResolverTypeWrapper<FileUploadUrl>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GlobalSettings: ResolverTypeWrapper<GlobalSettings>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  IntegrationConnection: ResolverTypeWrapper<SafeIntegrationConnection>;
  IntegrationProvider: ResolverTypeWrapper<IntegrationProviderDef>;
  JobStatus: JobStatus;
  ModelInfo: ResolverTypeWrapper<ModelInfo>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Notification: ResolverTypeWrapper<NotificationItem>;
  NotificationAction: ResolverTypeWrapper<NotificationAction>;
  NotificationStatus: NotificationStatus;
  NotificationType: NotificationType;
  OAuthConnectionMeta: ResolverTypeWrapper<OAuthConnectionMeta>;
  Profile: ResolverTypeWrapper<ProfileItem>;
  ProfileInput: ProfileInput;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SandboxOutput: ResolverTypeWrapper<SandboxOutput>;
  SendMessageResult: ResolverTypeWrapper<SendMessageResult>;
  Skill: ResolverTypeWrapper<SkillItem>;
  SkillConnectionRequirement: ResolverTypeWrapper<SkillConnectionRequirement>;
  SkillConnectionStatus: ResolverTypeWrapper<SkillConnectionStatus>;
  SkillTemplate: ResolverTypeWrapper<SkillTemplateModel>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Task: ResolverTypeWrapper<TaskItem>;
  TaskConnection: ResolverTypeWrapper<TaskConnectionModel>;
  TaskEdge: ResolverTypeWrapper<TaskEdgeModel>;
  TaskPageInfo: ResolverTypeWrapper<TaskPageInfoModel>;
  UpdateAgentInput: UpdateAgentInput;
  UpdateAgentJobInput: UpdateAgentJobInput;
  WorkspaceEntry: ResolverTypeWrapper<WorkspaceEntry>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Agent: AgentItem;
  AgentConfig: AgentConfig;
  AgentConfigInput: AgentConfigInput;
  AgentJob: AgentJobItem;
  AgentLog: AgentLogItem;
  AgentLogConnection: AgentLogConnectionModel;
  AgentLogEdge: AgentLogEdgeModel;
  AgentLogPageInfo: PageInfoModel;
  AgentModelConfig: AgentModelConfig;
  AgentModelConfigInput: AgentModelConfigInput;
  AgentSandboxConfig: AgentSandboxConfig;
  AgentSandboxConfigInput: AgentSandboxConfigInput;
  AgentWebSearchConfig: AgentWebSearchConfig;
  AgentWebSearchConfigInput: AgentWebSearchConfigInput;
  ApiKeyConnectionMeta: ApiKeyConnectionMeta;
  AvailableScope: AvailableScope;
  Avatar: AvatarModel;
  Boolean: Scalars['Boolean']['output'];
  CompleteFileUploadInput: CompleteFileUploadInput;
  CompletedFileUpload: CompletedFileUpload;
  ConnectionMeta: ResolversUnionTypes<ResolversParentTypes>['ConnectionMeta'];
  CreateAgentInput: CreateAgentInput;
  CreateAgentJobInput: CreateAgentJobInput;
  DefaultModel: DefaultModelResult;
  Document: Document;
  FileUploadRequest: FileUploadRequest;
  FileUploadUrl: FileUploadUrl;
  Float: Scalars['Float']['output'];
  GlobalSettings: GlobalSettings;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  IntegrationConnection: SafeIntegrationConnection;
  IntegrationProvider: IntegrationProviderDef;
  ModelInfo: ModelInfo;
  Mutation: Record<PropertyKey, never>;
  Notification: NotificationItem;
  NotificationAction: NotificationAction;
  OAuthConnectionMeta: OAuthConnectionMeta;
  Profile: ProfileItem;
  ProfileInput: ProfileInput;
  Query: Record<PropertyKey, never>;
  SandboxOutput: SandboxOutput;
  SendMessageResult: SendMessageResult;
  Skill: SkillItem;
  SkillConnectionRequirement: SkillConnectionRequirement;
  SkillConnectionStatus: SkillConnectionStatus;
  SkillTemplate: SkillTemplateModel;
  String: Scalars['String']['output'];
  Subscription: Record<PropertyKey, never>;
  Task: TaskItem;
  TaskConnection: TaskConnectionModel;
  TaskEdge: TaskEdgeModel;
  TaskPageInfo: TaskPageInfoModel;
  UpdateAgentInput: UpdateAgentInput;
  UpdateAgentJobInput: UpdateAgentJobInput;
  WorkspaceEntry: WorkspaceEntry;
};

export type AgentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Agent'] = ResolversParentTypes['Agent']> = {
  avatar?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  config?: Resolver<Maybe<ResolversTypes['AgentConfig']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<AgentImageUrlArgs>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  portraitId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  retired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  soul?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ttsVoice?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type AgentConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentConfig'] = ResolversParentTypes['AgentConfig']> = {
  model?: Resolver<Maybe<ResolversTypes['AgentModelConfig']>, ParentType, ContextType>;
  sandbox?: Resolver<Maybe<ResolversTypes['AgentSandboxConfig']>, ParentType, ContextType>;
  webSearch?: Resolver<Maybe<ResolversTypes['AgentWebSearchConfig']>, ParentType, ContextType>;
};

export type AgentJobResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentJob'] = ResolversParentTypes['AgentJob']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  cronExpression?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastRun?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nextRun?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  recurrence?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['JobStatus'], ParentType, ContextType>;
  tasks?: Resolver<Array<ResolversTypes['Task']>, ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type AgentLogResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentLog'] = ResolversParentTypes['AgentLog']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['AgentLogRole'], ParentType, ContextType>;
  taskId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  toolInput?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  toolName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  toolResult?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type AgentLogConnectionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentLogConnection'] = ResolversParentTypes['AgentLogConnection']> = {
  edges?: Resolver<Array<ResolversTypes['AgentLogEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['AgentLogPageInfo'], ParentType, ContextType>;
};

export type AgentLogEdgeResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentLogEdge'] = ResolversParentTypes['AgentLogEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['AgentLog'], ParentType, ContextType>;
};

export type AgentLogPageInfoResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentLogPageInfo'] = ResolversParentTypes['AgentLogPageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type AgentModelConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentModelConfig'] = ResolversParentTypes['AgentModelConfig']> = {
  connectionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  modelId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type AgentSandboxConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentSandboxConfig'] = ResolversParentTypes['AgentSandboxConfig']> = {
  alwaysOn?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  idleTimeoutMinutes?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type AgentWebSearchConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentWebSearchConfig'] = ResolversParentTypes['AgentWebSearchConfig']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  provider?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ApiKeyConnectionMetaResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ApiKeyConnectionMeta'] = ResolversParentTypes['ApiKeyConnectionMeta']> = {
  accountId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AvailableScopeResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AvailableScope'] = ResolversParentTypes['AvailableScope']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scope?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type AvatarResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Avatar'] = ResolversParentTypes['Avatar']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<AvatarUrlArgs>>;
};

export type CompletedFileUploadResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['CompletedFileUpload'] = ResolversParentTypes['CompletedFileUpload']> = {
  contentType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ConnectionMetaResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ConnectionMeta'] = ResolversParentTypes['ConnectionMeta']> = {
  __resolveType: TypeResolveFn<'ApiKeyConnectionMeta' | 'OAuthConnectionMeta', ParentType, ContextType>;
};

export type DefaultModelResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['DefaultModel'] = ResolversParentTypes['DefaultModel']> = {
  modelId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  providerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DocumentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Document'] = ResolversParentTypes['Document']> = {
  body?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type FileUploadUrlResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['FileUploadUrl'] = ResolversParentTypes['FileUploadUrl']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presignedUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type GlobalSettingsResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['GlobalSettings'] = ResolversParentTypes['GlobalSettings']> = {
  signupDisabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type IntegrationConnectionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['IntegrationConnection'] = ResolversParentTypes['IntegrationConnection']> = {
  connectedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  connectionType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isRevoked?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  meta?: Resolver<ResolversTypes['ConnectionMeta'], ParentType, ContextType>;
  providerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type IntegrationProviderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['IntegrationProvider'] = ResolversParentTypes['IntegrationProvider']> = {
  availableScopes?: Resolver<Array<ResolversTypes['AvailableScope']>, ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  connectionCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  connectionType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasConnection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  models?: Resolver<Maybe<Array<ResolversTypes['ModelInfo']>>, ParentType, ContextType>;
  service?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type JobStatusResolvers = EnumResolverSignature<{ ERROR?: any, IDLE?: any, PAUSED?: any, RUNNING?: any }, ResolversTypes['JobStatus']>;

export type ModelInfoResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ModelInfo'] = ResolversParentTypes['ModelInfo']> = {
  contextWindow?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inputCost?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  maxTokens?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  outputCost?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  reasoning?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bindSkillConnection?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationBindSkillConnectionArgs, 'connectionId' | 'id' | 'providerId'>>;
  completeFileUpload?: Resolver<ResolversTypes['CompletedFileUpload'], ParentType, ContextType, RequireFields<MutationCompleteFileUploadArgs, 'input'>>;
  connectApiKey?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationConnectApiKeyArgs, 'apiKey' | 'providerId'>>;
  createAgent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType, RequireFields<MutationCreateAgentArgs, 'input'>>;
  createAgentJob?: Resolver<ResolversTypes['AgentJob'], ParentType, ContextType, RequireFields<MutationCreateAgentJobArgs, 'input'>>;
  deleteAgentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<MutationDeleteAgentJobArgs, 'id'>>;
  disableBedrockModel?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDisableBedrockModelArgs, 'modelId'>>;
  dismissNotification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<MutationDismissNotificationArgs, 'id'>>;
  enableBedrockModel?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationEnableBedrockModelArgs, 'modelId'>>;
  installSkill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationInstallSkillArgs, 'templateId'>>;
  renameIntegrationConnection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRenameIntegrationConnectionArgs, 'description' | 'id'>>;
  requestFileUploads?: Resolver<Array<ResolversTypes['FileUploadUrl']>, ParentType, ContextType, RequireFields<MutationRequestFileUploadsArgs, 'agentId' | 'files'>>;
  resolveNotification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<MutationResolveNotificationArgs, 'actionId' | 'id'>>;
  retireAgent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType, RequireFields<MutationRetireAgentArgs, 'id'>>;
  revokeIntegrationConnection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRevokeIntegrationConnectionArgs, 'id'>>;
  sendMessage?: Resolver<ResolversTypes['SendMessageResult'], ParentType, ContextType, RequireFields<MutationSendMessageArgs, 'agentId' | 'content'>>;
  setDefaultModel?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSetDefaultModelArgs, 'modelId' | 'providerId'>>;
  setSkillMcpEnabled?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationSetSkillMcpEnabledArgs, 'enabled' | 'id'>>;
  submitOAuthConnection?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationSubmitOAuthConnectionArgs, 'accessToken' | 'providerId' | 'scopes'>>;
  uninstallSkill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationUninstallSkillArgs, 'id'>>;
  updateAgent?: Resolver<Maybe<ResolversTypes['Agent']>, ParentType, ContextType, RequireFields<MutationUpdateAgentArgs, 'id' | 'input'>>;
  updateAgentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<MutationUpdateAgentJobArgs, 'id' | 'input'>>;
  updateGlobalSettings?: Resolver<ResolversTypes['GlobalSettings'], ParentType, ContextType, Partial<MutationUpdateGlobalSettingsArgs>>;
  updateJobStatus?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<MutationUpdateJobStatusArgs, 'id' | 'status'>>;
  updateProfile?: Resolver<ResolversTypes['Profile'], ParentType, ContextType, RequireFields<MutationUpdateProfileArgs, 'input'>>;
};

export type NotificationResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']> = {
  actions?: Resolver<Array<ResolversTypes['NotificationAction']>, ParentType, ContextType>;
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolvedAction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['NotificationStatus'], ParentType, ContextType>;
  turnId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['NotificationType'], ParentType, ContextType>;
};

export type NotificationActionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['NotificationAction'] = ResolversParentTypes['NotificationAction']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  style?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type NotificationStatusResolvers = EnumResolverSignature<{ DISMISSED?: any, PENDING?: any, RESOLVED?: any }, ResolversTypes['NotificationStatus']>;

export type OAuthConnectionMetaResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['OAuthConnectionMeta'] = ResolversParentTypes['OAuthConnectionMeta']> = {
  accountId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  expiresAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scopes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProfileResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Profile'] = ResolversParentTypes['Profile']> = {
  about?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timezone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  website?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  agent?: Resolver<Maybe<ResolversTypes['Agent']>, ParentType, ContextType, RequireFields<QueryAgentArgs, 'id'>>;
  agentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<QueryAgentJobArgs, 'id'>>;
  agentJobs?: Resolver<Array<ResolversTypes['AgentJob']>, ParentType, ContextType>;
  agentLogs?: Resolver<ResolversTypes['AgentLogConnection'], ParentType, ContextType, RequireFields<QueryAgentLogsArgs, 'agentId'>>;
  agents?: Resolver<Array<ResolversTypes['Agent']>, ParentType, ContextType>;
  avatars?: Resolver<Array<ResolversTypes['Avatar']>, ParentType, ContextType>;
  bedrockEnabledModels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  defaultModel?: Resolver<Maybe<ResolversTypes['DefaultModel']>, ParentType, ContextType>;
  globalSettings?: Resolver<ResolversTypes['GlobalSettings'], ParentType, ContextType>;
  integrationConnections?: Resolver<Array<ResolversTypes['IntegrationConnection']>, ParentType, ContextType>;
  integrationProviders?: Resolver<Array<ResolversTypes['IntegrationProvider']>, ParentType, ContextType>;
  notifications?: Resolver<Array<ResolversTypes['Notification']>, ParentType, ContextType>;
  profile?: Resolver<ResolversTypes['Profile'], ParentType, ContextType>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<QuerySkillArgs, 'id'>>;
  skillTemplate?: Resolver<Maybe<ResolversTypes['SkillTemplate']>, ParentType, ContextType, RequireFields<QuerySkillTemplateArgs, 'id'>>;
  skillTemplates?: Resolver<Array<ResolversTypes['SkillTemplate']>, ParentType, ContextType>;
  skills?: Resolver<Array<ResolversTypes['Skill']>, ParentType, ContextType>;
  task?: Resolver<Maybe<ResolversTypes['Task']>, ParentType, ContextType, RequireFields<QueryTaskArgs, 'id'>>;
  taskLogs?: Resolver<ResolversTypes['AgentLogConnection'], ParentType, ContextType, RequireFields<QueryTaskLogsArgs, 'taskId'>>;
  tasks?: Resolver<ResolversTypes['TaskConnection'], ParentType, ContextType, Partial<QueryTasksArgs>>;
  workspaceEntries?: Resolver<Array<ResolversTypes['WorkspaceEntry']>, ParentType, ContextType, RequireFields<QueryWorkspaceEntriesArgs, 'path'>>;
  workspaceFile?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<QueryWorkspaceFileArgs, 'path'>>;
};

export type SandboxOutputResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SandboxOutput'] = ResolversParentTypes['SandboxOutput']> = {
  commandId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  data?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  done?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  exitCode?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  stream?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SendMessageResultResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SendMessageResult'] = ResolversParentTypes['SendMessageResult']> = {
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  queued?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type SkillResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Skill'] = ResolversParentTypes['Skill']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  installed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  installedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mcpEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  requiredConnections?: Resolver<Array<ResolversTypes['SkillConnectionStatus']>, ParentType, ContextType>;
  template?: Resolver<ResolversTypes['SkillTemplate'], ParentType, ContextType>;
};

export type SkillConnectionRequirementResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SkillConnectionRequirement'] = ResolversParentTypes['SkillConnectionRequirement']> = {
  optional?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  providerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  providerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SkillConnectionStatusResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SkillConnectionStatus'] = ResolversParentTypes['SkillConnectionStatus']> = {
  boundConnectionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  connected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  optional?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  providerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  providerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SkillTemplateResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SkillTemplate'] = ResolversParentTypes['SkillTemplate']> = {
  author?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasInstructions?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasMcp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  installCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requiredConnections?: Resolver<Array<ResolversTypes['SkillConnectionRequirement']>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  _empty?: SubscriptionResolver<Maybe<ResolversTypes['String']>, "_empty", ParentType, ContextType>;
  agentLogCreated?: SubscriptionResolver<ResolversTypes['AgentLog'], "agentLogCreated", ParentType, ContextType, RequireFields<SubscriptionAgentLogCreatedArgs, 'agentId'>>;
  agentUpdated?: SubscriptionResolver<ResolversTypes['Agent'], "agentUpdated", ParentType, ContextType, RequireFields<SubscriptionAgentUpdatedArgs, 'agentId'>>;
  agentsUpdated?: SubscriptionResolver<ResolversTypes['Agent'], "agentsUpdated", ParentType, ContextType, RequireFields<SubscriptionAgentsUpdatedArgs, 'agentIds'>>;
  sandboxOutput?: SubscriptionResolver<ResolversTypes['SandboxOutput'], "sandboxOutput", ParentType, ContextType, RequireFields<SubscriptionSandboxOutputArgs, 'taskId'>>;
  taskLogCreated?: SubscriptionResolver<ResolversTypes['AgentLog'], "taskLogCreated", ParentType, ContextType, RequireFields<SubscriptionTaskLogCreatedArgs, 'taskId'>>;
  taskUpdated?: SubscriptionResolver<ResolversTypes['Task'], "taskUpdated", ParentType, ContextType, RequireFields<SubscriptionTaskUpdatedArgs, 'taskId'>>;
  tasksUpdated?: SubscriptionResolver<ResolversTypes['Task'], "tasksUpdated", ParentType, ContextType, RequireFields<SubscriptionTasksUpdatedArgs, 'taskIds'>>;
};

export type TaskResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Task'] = ResolversParentTypes['Task']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  artifacts?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  documents?: Resolver<Array<ResolversTypes['Document']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<TaskImageUrlArgs>>;
  logs?: Resolver<ResolversTypes['AgentLogConnection'], ParentType, ContextType, Partial<TaskLogsArgs>>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  originJobId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TaskConnectionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['TaskConnection'] = ResolversParentTypes['TaskConnection']> = {
  edges?: Resolver<Array<ResolversTypes['TaskEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['TaskPageInfo'], ParentType, ContextType>;
};

export type TaskEdgeResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['TaskEdge'] = ResolversParentTypes['TaskEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Task'], ParentType, ContextType>;
};

export type TaskPageInfoResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['TaskPageInfo'] = ResolversParentTypes['TaskPageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type WorkspaceEntryResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['WorkspaceEntry'] = ResolversParentTypes['WorkspaceEntry']> = {
  isDirectory?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  mimeType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  modifiedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  size?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = GremlinContext> = {
  Agent?: AgentResolvers<ContextType>;
  AgentConfig?: AgentConfigResolvers<ContextType>;
  AgentJob?: AgentJobResolvers<ContextType>;
  AgentLog?: AgentLogResolvers<ContextType>;
  AgentLogConnection?: AgentLogConnectionResolvers<ContextType>;
  AgentLogEdge?: AgentLogEdgeResolvers<ContextType>;
  AgentLogPageInfo?: AgentLogPageInfoResolvers<ContextType>;
  AgentModelConfig?: AgentModelConfigResolvers<ContextType>;
  AgentSandboxConfig?: AgentSandboxConfigResolvers<ContextType>;
  AgentWebSearchConfig?: AgentWebSearchConfigResolvers<ContextType>;
  ApiKeyConnectionMeta?: ApiKeyConnectionMetaResolvers<ContextType>;
  AvailableScope?: AvailableScopeResolvers<ContextType>;
  Avatar?: AvatarResolvers<ContextType>;
  CompletedFileUpload?: CompletedFileUploadResolvers<ContextType>;
  ConnectionMeta?: ConnectionMetaResolvers<ContextType>;
  DefaultModel?: DefaultModelResolvers<ContextType>;
  Document?: DocumentResolvers<ContextType>;
  FileUploadUrl?: FileUploadUrlResolvers<ContextType>;
  GlobalSettings?: GlobalSettingsResolvers<ContextType>;
  IntegrationConnection?: IntegrationConnectionResolvers<ContextType>;
  IntegrationProvider?: IntegrationProviderResolvers<ContextType>;
  JobStatus?: JobStatusResolvers;
  ModelInfo?: ModelInfoResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  NotificationAction?: NotificationActionResolvers<ContextType>;
  NotificationStatus?: NotificationStatusResolvers;
  OAuthConnectionMeta?: OAuthConnectionMetaResolvers<ContextType>;
  Profile?: ProfileResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SandboxOutput?: SandboxOutputResolvers<ContextType>;
  SendMessageResult?: SendMessageResultResolvers<ContextType>;
  Skill?: SkillResolvers<ContextType>;
  SkillConnectionRequirement?: SkillConnectionRequirementResolvers<ContextType>;
  SkillConnectionStatus?: SkillConnectionStatusResolvers<ContextType>;
  SkillTemplate?: SkillTemplateResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Task?: TaskResolvers<ContextType>;
  TaskConnection?: TaskConnectionResolvers<ContextType>;
  TaskEdge?: TaskEdgeResolvers<ContextType>;
  TaskPageInfo?: TaskPageInfoResolvers<ContextType>;
  WorkspaceEntry?: WorkspaceEntryResolvers<ContextType>;
};

