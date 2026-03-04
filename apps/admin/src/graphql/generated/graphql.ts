/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  portraitId: Scalars['String']['output'];
  soul: Scalars['String']['output'];
  status: AgentStatus;
  statusReason?: Maybe<Scalars['String']['output']>;
};


export type AgentImageUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
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

export enum AgentStatus {
  Active = 'ACTIVE',
  Blocked = 'BLOCKED',
  Idle = 'IDLE',
  Scheduled = 'SCHEDULED'
}

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

export type ConnectionMeta = ApiKeyConnectionMeta | OAuthConnectionMeta;

export type CreateDocumentInput = {
  body: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type DefaultModel = {
  __typename?: 'DefaultModel';
  modelId: Scalars['String']['output'];
  providerId: Scalars['String']['output'];
};

export type Document = {
  __typename?: 'Document';
  body: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
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

export enum JobStatus {
  Error = 'ERROR',
  Idle = 'IDLE',
  Paused = 'PAUSED',
  Running = 'RUNNING'
}

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
  connectApiKey: Scalars['ID']['output'];
  connectIntegration: Scalars['String']['output'];
  createDocument: Document;
  deactivateFollowUp?: Maybe<TaskFollowUp>;
  deleteAgentJob?: Maybe<AgentJob>;
  disableBedrockModel: Scalars['Boolean']['output'];
  dismissNotification?: Maybe<Notification>;
  enableBedrockModel: Scalars['Boolean']['output'];
  installSkill?: Maybe<Skill>;
  renameIntegrationConnection: Scalars['Boolean']['output'];
  resolveNotification?: Maybe<Notification>;
  revokeIntegrationConnection: Scalars['Boolean']['output'];
  sendMessage: AgentLog;
  setDefaultModel: Scalars['Boolean']['output'];
  uninstallSkill?: Maybe<Skill>;
  updateAgent?: Maybe<Agent>;
  updateAgentJob?: Maybe<AgentJob>;
  updateAgentStatus?: Maybe<Agent>;
  updateDocument: Document;
  updateJobStatus?: Maybe<AgentJob>;
  updateProfile: Profile;
};


export type MutationConnectApiKeyArgs = {
  apiKey: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
};


export type MutationConnectIntegrationArgs = {
  providerId: Scalars['String']['input'];
  scopes: Array<Scalars['String']['input']>;
};


export type MutationCreateDocumentArgs = {
  input: CreateDocumentInput;
};


export type MutationDeactivateFollowUpArgs = {
  id: Scalars['ID']['input'];
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
  id: Scalars['ID']['input'];
};


export type MutationRenameIntegrationConnectionArgs = {
  description: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationResolveNotificationArgs = {
  actionId: Scalars['String']['input'];
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


export type MutationUpdateAgentStatusArgs = {
  id: Scalars['ID']['input'];
  status: AgentStatus;
};


export type MutationUpdateDocumentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDocumentInput;
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

export enum NotificationStatus {
  Dismissed = 'DISMISSED',
  Pending = 'PENDING',
  Resolved = 'RESOLVED'
}

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
  activeFollowUps: Array<TaskFollowUp>;
  agent?: Maybe<Agent>;
  agentJob?: Maybe<AgentJob>;
  agentJobs: Array<AgentJob>;
  agentLogs: AgentLogConnection;
  agents: Array<Agent>;
  avatars: Array<Avatar>;
  bedrockEnabledModels: Array<Scalars['String']['output']>;
  defaultModel?: Maybe<DefaultModel>;
  document?: Maybe<Document>;
  documents: Array<Document>;
  integrationConnections: Array<IntegrationConnection>;
  integrationProviders: Array<IntegrationProvider>;
  notifications: Array<Notification>;
  profile: Profile;
  searchSkills: Array<Skill>;
  skill?: Maybe<Skill>;
  skills: Array<Skill>;
  task?: Maybe<Task>;
  taskFollowUps: Array<TaskFollowUp>;
  taskLogs: AgentLogConnection;
  tasks: TaskConnection;
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


export type QueryDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySearchSkillsArgs = {
  query: Scalars['String']['input'];
};


export type QuerySkillArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskFollowUpsArgs = {
  taskId: Scalars['ID']['input'];
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

export type Skill = {
  __typename?: 'Skill';
  author: Scalars['String']['output'];
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  homepage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  installed: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  requiredEnv: Array<Scalars['String']['output']>;
  version: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  _empty?: Maybe<Scalars['String']['output']>;
  agentLogCreated: AgentLog;
  agentUpdated: Agent;
  agentsUpdated: Agent;
  documentUpdated: Document;
  documentsUpdated: Document;
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


export type SubscriptionDocumentUpdatedArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionDocumentsUpdatedArgs = {
  documentIds: Array<Scalars['ID']['input']>;
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
  logs: AgentLogConnection;
  message?: Maybe<Scalars['String']['output']>;
  originJobId?: Maybe<Scalars['String']['output']>;
  status: TaskStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
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

export type TaskFollowUp = {
  __typename?: 'TaskFollowUp';
  active: Scalars['Boolean']['output'];
  agent: Agent;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  prompt: Scalars['String']['output'];
  scheduledAt: Scalars['String']['output'];
  task: Task;
};

export type TaskPageInfo = {
  __typename?: 'TaskPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export enum TaskStatus {
  Abandoned = 'ABANDONED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Running = 'RUNNING',
  Waiting = 'WAITING'
}

export type UpdateAgentInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  soul?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAgentJobInput = {
  agentId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  recurrence?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDocumentInput = {
  body: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type AgentLogsQueryVariables = Exact<{
  agentId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type AgentLogsQuery = { __typename?: 'Query', agentLogs: { __typename?: 'AgentLogConnection', edges: Array<{ __typename?: 'AgentLogEdge', cursor: string, node: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: string | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string } }>, pageInfo: { __typename?: 'AgentLogPageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type SendMessageMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  taskId?: InputMaybe<Scalars['String']['input']>;
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: string | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string } };

export type AgentLogCreatedSubscriptionVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentLogCreatedSubscription = { __typename?: 'Subscription', agentLogCreated: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: string | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string } };

export type AgentsQueryVariables = Exact<{ [key: string]: never; }>;


export type AgentsQuery = { __typename?: 'Query', agents: Array<{ __typename?: 'Agent', id: string, name: string, soul: string, statusReason?: string | null }> };

export type AgentQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AgentQuery = { __typename?: 'Query', agent?: { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, soul: string, status: AgentStatus, statusReason?: string | null } | null };

export type UpdateAgentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAgentInput;
}>;


export type UpdateAgentMutation = { __typename?: 'Mutation', updateAgent?: { __typename?: 'Agent', id: string, name: string, avatar: string, soul: string } | null };

export type AgentUpdatedSubscriptionVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentUpdatedSubscription = { __typename?: 'Subscription', agentUpdated: { __typename?: 'Agent', id: string, status: AgentStatus, statusReason?: string | null } };

export type DocumentQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DocumentQuery = { __typename?: 'Query', document?: { __typename?: 'Document', id: string, title: string, body: string, createdAt: string, updatedAt: string } | null };

export type DocumentUpdatedSubscriptionVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DocumentUpdatedSubscription = { __typename?: 'Subscription', documentUpdated: { __typename?: 'Document', id: string, title: string, body: string, updatedAt: string } };

export type IntegrationProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationProvidersQuery = { __typename?: 'Query', integrationProviders: Array<{ __typename?: 'IntegrationProvider', id: string, service: string, category: string, description: string, connectionType: string, connectionCount: number, hasConnection: boolean, availableScopes: Array<{ __typename?: 'AvailableScope', scope: string, label: string }>, models?: Array<{ __typename?: 'ModelInfo', id: string, name: string, contextWindow: number, maxTokens: number, reasoning: boolean, inputCost?: number | null, outputCost?: number | null }> | null }>, defaultModel?: { __typename?: 'DefaultModel', providerId: string, modelId: string } | null };

export type IntegrationConnectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationConnectionsQuery = { __typename?: 'Query', integrationConnections: Array<{ __typename?: 'IntegrationConnection', id: string, providerId: string, connectionType: string, description: string, connectedAt: string, isRevoked: boolean, meta:
      | { __typename: 'ApiKeyConnectionMeta', accountId?: string | null }
      | { __typename: 'OAuthConnectionMeta', accountId?: string | null, scopes: Array<string>, expiresAt?: string | null }
     }> };

export type ConnectIntegrationMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  scopes: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type ConnectIntegrationMutation = { __typename?: 'Mutation', connectIntegration: string };

export type ConnectApiKeyMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  apiKey: Scalars['String']['input'];
}>;


export type ConnectApiKeyMutation = { __typename?: 'Mutation', connectApiKey: string };

export type RenameConnectionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  description: Scalars['String']['input'];
}>;


export type RenameConnectionMutation = { __typename?: 'Mutation', renameIntegrationConnection: boolean };

export type RevokeConnectionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RevokeConnectionMutation = { __typename?: 'Mutation', revokeIntegrationConnection: boolean };

export type SetDefaultModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type SetDefaultModelMutation = { __typename?: 'Mutation', setDefaultModel: boolean };

export type BedrockEnabledModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type BedrockEnabledModelsQuery = { __typename?: 'Query', bedrockEnabledModels: Array<string> };

export type EnableBedrockModelMutationVariables = Exact<{
  modelId: Scalars['String']['input'];
}>;


export type EnableBedrockModelMutation = { __typename?: 'Mutation', enableBedrockModel: boolean };

export type DisableBedrockModelMutationVariables = Exact<{
  modelId: Scalars['String']['input'];
}>;


export type DisableBedrockModelMutation = { __typename?: 'Mutation', disableBedrockModel: boolean };

export type AgentJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type AgentJobsQuery = { __typename?: 'Query', agentJobs: Array<{ __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, status: JobStatus, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string } }> };

export type AgentJobQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AgentJobQuery = { __typename?: 'Query', agentJob?: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, status: JobStatus, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string }, tasks: Array<{ __typename?: 'Task', id: string, title: string, status: TaskStatus, createdAt: string, agent: { __typename?: 'Agent', id: string } }> } | null };

export type DeleteAgentJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAgentJobMutation = { __typename?: 'Mutation', deleteAgentJob?: { __typename?: 'AgentJob', id: string } | null };

export type UpdateAgentJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAgentJobInput;
}>;


export type UpdateAgentJobMutation = { __typename?: 'Mutation', updateAgentJob?: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, status: JobStatus, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string } } | null };

export type NotificationsQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationsQuery = { __typename?: 'Query', notifications: Array<{ __typename?: 'Notification', id: string, type: NotificationType, turnId?: string | null, message: string, status: NotificationStatus, resolvedAction?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string }, actions: Array<{ __typename?: 'NotificationAction', id: string, label: string, style: string }> }> };

export type ResolveNotificationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  actionId: Scalars['String']['input'];
}>;


export type ResolveNotificationMutation = { __typename?: 'Mutation', resolveNotification?: { __typename?: 'Notification', id: string, status: NotificationStatus, resolvedAction?: string | null } | null };

export type DismissNotificationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DismissNotificationMutation = { __typename?: 'Mutation', dismissNotification?: { __typename?: 'Notification', id: string, status: NotificationStatus } | null };

export type ProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type ProfileQuery = { __typename?: 'Query', profile: { __typename?: 'Profile', displayName: string, about: string, website?: string | null, timezone?: string | null } };

export type UpdateProfileMutationVariables = Exact<{
  input: ProfileInput;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'Profile', displayName: string, about: string, website?: string | null, timezone?: string | null } };

export type AvatarsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvatarsQuery = { __typename?: 'Query', avatars: Array<{ __typename?: 'Avatar', id: string, name: string, url: string }> };

export type SkillsQueryVariables = Exact<{ [key: string]: never; }>;


export type SkillsQuery = { __typename?: 'Query', skills: Array<{ __typename?: 'Skill', id: string, name: string, description: string, version: string, installed: boolean }> };

export type SkillQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SkillQuery = { __typename?: 'Query', skill?: { __typename?: 'Skill', id: string, name: string, description: string, version: string, author: string, installed: boolean, category: string, homepage?: string | null, requiredEnv: Array<string> } | null };

export type InstallSkillMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type InstallSkillMutation = { __typename?: 'Mutation', installSkill?: { __typename?: 'Skill', id: string, name: string, description: string, version: string, author: string, installed: boolean, category: string, homepage?: string | null, requiredEnv: Array<string> } | null };

export type UninstallSkillMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UninstallSkillMutation = { __typename?: 'Mutation', uninstallSkill?: { __typename?: 'Skill', id: string, name: string, description: string, version: string, author: string, installed: boolean, category: string, homepage?: string | null, requiredEnv: Array<string> } | null };

export type TasksQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type TasksQuery = { __typename?: 'Query', tasks: { __typename?: 'TaskConnection', edges: Array<{ __typename?: 'TaskEdge', cursor: string, node: { __typename?: 'Task', id: string, title: string, status: TaskStatus, message?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string }, documents: Array<{ __typename?: 'Document', id: string, title: string, body: string, createdAt: string, updatedAt: string }> } }>, pageInfo: { __typename?: 'TaskPageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type TaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TaskQuery = { __typename?: 'Query', task?: { __typename?: 'Task', id: string, title: string, status: TaskStatus, message?: string | null, createdAt: string, updatedAt: string, completedAt?: string | null, artifacts: Array<string>, agent: { __typename?: 'Agent', id: string }, documents: Array<{ __typename?: 'Document', id: string, title: string, body: string, createdAt: string, updatedAt: string }> } | null };

export type TaskLogsQueryVariables = Exact<{
  taskId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type TaskLogsQuery = { __typename?: 'Query', taskLogs: { __typename?: 'AgentLogConnection', edges: Array<{ __typename?: 'AgentLogEdge', cursor: string, node: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: string | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string } }>, pageInfo: { __typename?: 'AgentLogPageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type TaskLogCreatedSubscriptionVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type TaskLogCreatedSubscription = { __typename?: 'Subscription', taskLogCreated: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: string | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string } };

export type TaskUpdatedSubscriptionVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type TaskUpdatedSubscription = { __typename?: 'Subscription', taskUpdated: { __typename?: 'Task', id: string, title: string, status: TaskStatus, message?: string | null, updatedAt: string, completedAt?: string | null, artifacts: Array<string>, documents: Array<{ __typename?: 'Document', id: string, title: string, body: string, updatedAt: string }> } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const AgentLogsDocument = new TypedDocumentString(`
    query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  agentLogs(
    agentId: $agentId
    first: $first
    after: $after
    last: $last
    before: $before
  ) {
    edges {
      cursor
      node {
        id
        role
        content
        toolName
        toolInput
        toolResult
        taskId
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `) as unknown as TypedDocumentString<AgentLogsQuery, AgentLogsQueryVariables>;
export const SendMessageDocument = new TypedDocumentString(`
    mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {
  sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {
    id
    role
    content
    toolName
    toolInput
    toolResult
    taskId
    createdAt
  }
}
    `) as unknown as TypedDocumentString<SendMessageMutation, SendMessageMutationVariables>;
export const AgentLogCreatedDocument = new TypedDocumentString(`
    subscription AgentLogCreated($agentId: ID!) {
  agentLogCreated(agentId: $agentId) {
    id
    role
    content
    toolName
    toolInput
    toolResult
    taskId
    createdAt
  }
}
    `) as unknown as TypedDocumentString<AgentLogCreatedSubscription, AgentLogCreatedSubscriptionVariables>;
export const AgentsDocument = new TypedDocumentString(`
    query Agents {
  agents {
    id
    name
    soul
    statusReason
  }
}
    `) as unknown as TypedDocumentString<AgentsQuery, AgentsQueryVariables>;
export const AgentDocument = new TypedDocumentString(`
    query Agent($id: ID!) {
  agent(id: $id) {
    id
    name
    avatar
    portraitId
    imageUrl(width: 100)
    soul
    status
    statusReason
  }
}
    `) as unknown as TypedDocumentString<AgentQuery, AgentQueryVariables>;
export const UpdateAgentDocument = new TypedDocumentString(`
    mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {
  updateAgent(id: $id, input: $input) {
    id
    name
    avatar
    soul
  }
}
    `) as unknown as TypedDocumentString<UpdateAgentMutation, UpdateAgentMutationVariables>;
export const AgentUpdatedDocument = new TypedDocumentString(`
    subscription AgentUpdated($agentId: ID!) {
  agentUpdated(agentId: $agentId) {
    id
    status
    statusReason
  }
}
    `) as unknown as TypedDocumentString<AgentUpdatedSubscription, AgentUpdatedSubscriptionVariables>;
export const DocumentDocument = new TypedDocumentString(`
    query Document($id: ID!) {
  document(id: $id) {
    id
    title
    body
    createdAt
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<DocumentQuery, DocumentQueryVariables>;
export const DocumentUpdatedDocument = new TypedDocumentString(`
    subscription DocumentUpdated($id: ID!) {
  documentUpdated(id: $id) {
    id
    title
    body
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<DocumentUpdatedSubscription, DocumentUpdatedSubscriptionVariables>;
export const IntegrationProvidersDocument = new TypedDocumentString(`
    query IntegrationProviders {
  integrationProviders {
    id
    service
    category
    description
    connectionType
    availableScopes {
      scope
      label
    }
    models {
      id
      name
      contextWindow
      maxTokens
      reasoning
      inputCost
      outputCost
    }
    connectionCount
    hasConnection
  }
  defaultModel {
    providerId
    modelId
  }
}
    `) as unknown as TypedDocumentString<IntegrationProvidersQuery, IntegrationProvidersQueryVariables>;
export const IntegrationConnectionsDocument = new TypedDocumentString(`
    query IntegrationConnections {
  integrationConnections {
    id
    providerId
    connectionType
    description
    connectedAt
    isRevoked
    meta {
      __typename
      ... on OAuthConnectionMeta {
        accountId
        scopes
        expiresAt
      }
      ... on ApiKeyConnectionMeta {
        accountId
      }
    }
  }
}
    `) as unknown as TypedDocumentString<IntegrationConnectionsQuery, IntegrationConnectionsQueryVariables>;
export const ConnectIntegrationDocument = new TypedDocumentString(`
    mutation ConnectIntegration($providerId: String!, $scopes: [String!]!) {
  connectIntegration(providerId: $providerId, scopes: $scopes)
}
    `) as unknown as TypedDocumentString<ConnectIntegrationMutation, ConnectIntegrationMutationVariables>;
export const ConnectApiKeyDocument = new TypedDocumentString(`
    mutation ConnectApiKey($providerId: String!, $apiKey: String!) {
  connectApiKey(providerId: $providerId, apiKey: $apiKey)
}
    `) as unknown as TypedDocumentString<ConnectApiKeyMutation, ConnectApiKeyMutationVariables>;
export const RenameConnectionDocument = new TypedDocumentString(`
    mutation RenameConnection($id: ID!, $description: String!) {
  renameIntegrationConnection(id: $id, description: $description)
}
    `) as unknown as TypedDocumentString<RenameConnectionMutation, RenameConnectionMutationVariables>;
export const RevokeConnectionDocument = new TypedDocumentString(`
    mutation RevokeConnection($id: ID!) {
  revokeIntegrationConnection(id: $id)
}
    `) as unknown as TypedDocumentString<RevokeConnectionMutation, RevokeConnectionMutationVariables>;
export const SetDefaultModelDocument = new TypedDocumentString(`
    mutation SetDefaultModel($providerId: String!, $modelId: String!) {
  setDefaultModel(providerId: $providerId, modelId: $modelId)
}
    `) as unknown as TypedDocumentString<SetDefaultModelMutation, SetDefaultModelMutationVariables>;
export const BedrockEnabledModelsDocument = new TypedDocumentString(`
    query BedrockEnabledModels {
  bedrockEnabledModels
}
    `) as unknown as TypedDocumentString<BedrockEnabledModelsQuery, BedrockEnabledModelsQueryVariables>;
export const EnableBedrockModelDocument = new TypedDocumentString(`
    mutation EnableBedrockModel($modelId: String!) {
  enableBedrockModel(modelId: $modelId)
}
    `) as unknown as TypedDocumentString<EnableBedrockModelMutation, EnableBedrockModelMutationVariables>;
export const DisableBedrockModelDocument = new TypedDocumentString(`
    mutation DisableBedrockModel($modelId: String!) {
  disableBedrockModel(modelId: $modelId)
}
    `) as unknown as TypedDocumentString<DisableBedrockModelMutation, DisableBedrockModelMutationVariables>;
export const AgentJobsDocument = new TypedDocumentString(`
    query AgentJobs {
  agentJobs {
    id
    name
    description
    recurrence
    cronExpression
    timezone
    agent {
      id
    }
    status
    lastRun
    nextRun
  }
}
    `) as unknown as TypedDocumentString<AgentJobsQuery, AgentJobsQueryVariables>;
export const AgentJobDocument = new TypedDocumentString(`
    query AgentJob($id: ID!) {
  agentJob(id: $id) {
    id
    name
    description
    recurrence
    cronExpression
    timezone
    agent {
      id
      name
    }
    status
    lastRun
    nextRun
    tasks {
      id
      agent {
        id
      }
      title
      status
      createdAt
    }
  }
}
    `) as unknown as TypedDocumentString<AgentJobQuery, AgentJobQueryVariables>;
export const DeleteAgentJobDocument = new TypedDocumentString(`
    mutation DeleteAgentJob($id: ID!) {
  deleteAgentJob(id: $id) {
    id
  }
}
    `) as unknown as TypedDocumentString<DeleteAgentJobMutation, DeleteAgentJobMutationVariables>;
export const UpdateAgentJobDocument = new TypedDocumentString(`
    mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {
  updateAgentJob(id: $id, input: $input) {
    id
    name
    description
    recurrence
    cronExpression
    timezone
    agent {
      id
    }
    status
    lastRun
    nextRun
  }
}
    `) as unknown as TypedDocumentString<UpdateAgentJobMutation, UpdateAgentJobMutationVariables>;
export const NotificationsDocument = new TypedDocumentString(`
    query Notifications {
  notifications {
    id
    agent {
      id
      name
    }
    type
    turnId
    message
    actions {
      id
      label
      style
    }
    status
    resolvedAction
    createdAt
  }
}
    `) as unknown as TypedDocumentString<NotificationsQuery, NotificationsQueryVariables>;
export const ResolveNotificationDocument = new TypedDocumentString(`
    mutation ResolveNotification($id: ID!, $actionId: String!) {
  resolveNotification(id: $id, actionId: $actionId) {
    id
    status
    resolvedAction
  }
}
    `) as unknown as TypedDocumentString<ResolveNotificationMutation, ResolveNotificationMutationVariables>;
export const DismissNotificationDocument = new TypedDocumentString(`
    mutation DismissNotification($id: ID!) {
  dismissNotification(id: $id) {
    id
    status
  }
}
    `) as unknown as TypedDocumentString<DismissNotificationMutation, DismissNotificationMutationVariables>;
export const ProfileDocument = new TypedDocumentString(`
    query Profile {
  profile {
    displayName
    about
    website
    timezone
  }
}
    `) as unknown as TypedDocumentString<ProfileQuery, ProfileQueryVariables>;
export const UpdateProfileDocument = new TypedDocumentString(`
    mutation UpdateProfile($input: ProfileInput!) {
  updateProfile(input: $input) {
    displayName
    about
    website
    timezone
  }
}
    `) as unknown as TypedDocumentString<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const AvatarsDocument = new TypedDocumentString(`
    query Avatars {
  avatars {
    id
    name
    url(width: 200)
  }
}
    `) as unknown as TypedDocumentString<AvatarsQuery, AvatarsQueryVariables>;
export const SkillsDocument = new TypedDocumentString(`
    query Skills {
  skills {
    id
    name
    description
    version
    installed
  }
}
    `) as unknown as TypedDocumentString<SkillsQuery, SkillsQueryVariables>;
export const SkillDocument = new TypedDocumentString(`
    query Skill($id: ID!) {
  skill(id: $id) {
    id
    name
    description
    version
    author
    installed
    category
    homepage
    requiredEnv
  }
}
    `) as unknown as TypedDocumentString<SkillQuery, SkillQueryVariables>;
export const InstallSkillDocument = new TypedDocumentString(`
    mutation InstallSkill($id: ID!) {
  installSkill(id: $id) {
    id
    name
    description
    version
    author
    installed
    category
    homepage
    requiredEnv
  }
}
    `) as unknown as TypedDocumentString<InstallSkillMutation, InstallSkillMutationVariables>;
export const UninstallSkillDocument = new TypedDocumentString(`
    mutation UninstallSkill($id: ID!) {
  uninstallSkill(id: $id) {
    id
    name
    description
    version
    author
    installed
    category
    homepage
    requiredEnv
  }
}
    `) as unknown as TypedDocumentString<UninstallSkillMutation, UninstallSkillMutationVariables>;
export const TasksDocument = new TypedDocumentString(`
    query Tasks($first: Int, $after: String, $last: Int, $before: String) {
  tasks(first: $first, after: $after, last: $last, before: $before) {
    edges {
      cursor
      node {
        id
        agent {
          id
          name
        }
        title
        status
        message
        createdAt
        documents {
          id
          title
          body
          createdAt
          updatedAt
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `) as unknown as TypedDocumentString<TasksQuery, TasksQueryVariables>;
export const TaskDocument = new TypedDocumentString(`
    query Task($id: ID!) {
  task(id: $id) {
    id
    agent {
      id
    }
    title
    status
    message
    createdAt
    updatedAt
    completedAt
    artifacts
    documents {
      id
      title
      body
      createdAt
      updatedAt
    }
  }
}
    `) as unknown as TypedDocumentString<TaskQuery, TaskQueryVariables>;
export const TaskLogsDocument = new TypedDocumentString(`
    query TaskLogs($taskId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  taskLogs(
    taskId: $taskId
    first: $first
    after: $after
    last: $last
    before: $before
  ) {
    edges {
      cursor
      node {
        id
        role
        content
        toolName
        toolInput
        toolResult
        taskId
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `) as unknown as TypedDocumentString<TaskLogsQuery, TaskLogsQueryVariables>;
export const TaskLogCreatedDocument = new TypedDocumentString(`
    subscription TaskLogCreated($taskId: ID!) {
  taskLogCreated(taskId: $taskId) {
    id
    role
    content
    toolName
    toolInput
    toolResult
    taskId
    createdAt
  }
}
    `) as unknown as TypedDocumentString<TaskLogCreatedSubscription, TaskLogCreatedSubscriptionVariables>;
export const TaskUpdatedDocument = new TypedDocumentString(`
    subscription TaskUpdated($taskId: ID!) {
  taskUpdated(taskId: $taskId) {
    id
    title
    status
    message
    updatedAt
    completedAt
    artifacts
    documents {
      id
      title
      body
      updatedAt
    }
  }
}
    `) as unknown as TypedDocumentString<TaskUpdatedSubscription, TaskUpdatedSubscriptionVariables>;