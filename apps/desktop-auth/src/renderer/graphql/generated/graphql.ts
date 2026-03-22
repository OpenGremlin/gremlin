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
  viewImage?: Maybe<AgentViewImageConfig>;
  webSearch?: Maybe<AgentWebSearchConfig>;
};

export type AgentConfigInput = {
  model?: InputMaybe<AgentModelConfigInput>;
  sandbox?: InputMaybe<AgentSandboxConfigInput>;
  viewImage?: InputMaybe<AgentViewImageConfigInput>;
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
  paused: Scalars['Boolean']['output'];
  recurrence: Scalars['String']['output'];
  tasks: Array<Task>;
  timezone: Scalars['String']['output'];
};

export type AgentLog = {
  __typename?: 'AgentLog';
  agent: Agent;
  attachments: Array<Attachment>;
  commandApprovalId?: Maybe<Scalars['String']['output']>;
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  /** @deprecated Use attachments instead */
  documents: Array<Document>;
  /** @deprecated Use attachments instead */
  files: Array<File>;
  id: Scalars['ID']['output'];
  role: AgentLogRole;
  taskId?: Maybe<Scalars['String']['output']>;
  toolInput?: Maybe<Scalars['String']['output']>;
  toolName?: Maybe<ToolName>;
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
  commandApproval: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  idleTimeoutMinutes?: Maybe<Scalars['Int']['output']>;
};

export type AgentSandboxConfigInput = {
  alwaysOn?: InputMaybe<Scalars['Boolean']['input']>;
  commandApproval: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  idleTimeoutMinutes?: InputMaybe<Scalars['Int']['input']>;
};

export type AgentSkill = {
  __typename?: 'AgentSkill';
  agentId: Scalars['ID']['output'];
  assignedAt: Scalars['String']['output'];
  connectionStatuses: Array<SkillConnectionStatus>;
  skillId: Scalars['ID']['output'];
  template?: Maybe<SkillTemplate>;
};

export type AgentViewImageConfig = {
  __typename?: 'AgentViewImageConfig';
  enabled: Scalars['Boolean']['output'];
};

export type AgentViewImageConfigInput = {
  enabled: Scalars['Boolean']['input'];
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

export type AllowlistEntry = {
  __typename?: 'AllowlistEntry';
  pattern: Scalars['String']['output'];
};

export type ApiKeyConnectionMeta = {
  __typename?: 'ApiKeyConnectionMeta';
  accountId?: Maybe<Scalars['String']['output']>;
};

export type Attachment = FileAttachment | LinkAttachment;

export type AudioRender = {
  __typename?: 'AudioRender';
  durationSeconds?: Maybe<Scalars['Float']['output']>;
  url?: Maybe<Scalars['String']['output']>;
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

export type CodeRender = {
  __typename?: 'CodeRender';
  content: Scalars['String']['output'];
  language: Scalars['String']['output'];
};

export type CommandApproval = {
  __typename?: 'CommandApproval';
  agent: Agent;
  command: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  decision?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  reason: Scalars['String']['output'];
  resolvedAt?: Maybe<Scalars['String']['output']>;
  status: CommandApprovalStatus;
  taskId: Scalars['String']['output'];
};

export enum CommandApprovalDecision {
  AllowAlways = 'ALLOW_ALWAYS',
  AllowOnce = 'ALLOW_ONCE',
  Deny = 'DENY'
}

export enum CommandApprovalStatus {
  Pending = 'PENDING',
  Resolved = 'RESOLVED'
}

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

export type ConnectApiKeyResult = {
  __typename?: 'ConnectApiKeyResult';
  connectionId: Scalars['ID']['output'];
  models: Array<ProviderModelInfo>;
};

export type ConnectionMeta = ApiKeyConnectionMeta | OAuthConnectionMeta;

export type CreateAgentInput = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  soul?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAgentJobInput = {
  agentId: Scalars['String']['input'];
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

export type DocumentRender = {
  __typename?: 'DocumentRender';
  markdown: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

export type EnabledModelEntry = {
  __typename?: 'EnabledModelEntry';
  modelId: Scalars['String']['output'];
  modelName?: Maybe<Scalars['String']['output']>;
  providerId: Scalars['String']['output'];
};

export type File = {
  __typename?: 'File';
  mimeType?: Maybe<Scalars['String']['output']>;
  modifiedAt: Scalars['String']['output'];
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  render: FileRender;
  sizeBytes: Scalars['Int']['output'];
};

export type FileAttachment = {
  __typename?: 'FileAttachment';
  file: File;
};

export type FileRender = AudioRender | CodeRender | DocumentRender | ImageRender | UnknownRender | VideoRender;

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

export type ImageRender = {
  __typename?: 'ImageRender';
  aspectRatio?: Maybe<Scalars['Float']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};


export type ImageRenderUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type IntegrationConnection = {
  __typename?: 'IntegrationConnection';
  connectedAt: Scalars['String']['output'];
  connectionType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isRevoked: Scalars['Boolean']['output'];
  meta: ConnectionMeta;
  provider: IntegrationProvider;
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

export type LinkAttachment = {
  __typename?: 'LinkAttachment';
  description?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

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
  addCommandAllowlistEntry: Array<AllowlistEntry>;
  /** Assign a skill to an agent */
  assignSkill: AgentSkill;
  /** Bind a connection to an agent's skill */
  bindAgentSkillConnection: AgentSkill;
  completeFileUpload: CompletedFileUpload;
  connectApiKey: ConnectApiKeyResult;
  createAgent: Agent;
  createAgentJob: AgentJob;
  deleteAgentJob?: Maybe<AgentJob>;
  disableBedrockModel: Scalars['Boolean']['output'];
  disableModel: Scalars['Boolean']['output'];
  dismissUserInputRequest?: Maybe<UserInputRequest>;
  enableBedrockModel: Scalars['Boolean']['output'];
  enableModel: Scalars['Boolean']['output'];
  removeCommandAllowlistEntry: Array<AllowlistEntry>;
  /** Remove a skill from an agent */
  removeSkill: Scalars['Boolean']['output'];
  requestFileUploads: Array<FileUploadUrl>;
  resolveCommandApproval?: Maybe<CommandApproval>;
  resolveUserInputRequest?: Maybe<UserInputRequest>;
  retireAgent: Agent;
  revokeIntegrationConnection: Scalars['Boolean']['output'];
  sendMessage: SendMessageResult;
  setDefaultModel: Scalars['Boolean']['output'];
  submitOAuthConnection: Scalars['ID']['output'];
  triggerJob: Scalars['Boolean']['output'];
  /** Unbind a connection from an agent's skill */
  unbindAgentSkillConnection: AgentSkill;
  unretireAgent: Agent;
  updateAgent?: Maybe<Agent>;
  updateAgentJob?: Maybe<AgentJob>;
  updateGlobalSettings: GlobalSettings;
  updateProfile: Profile;
};


export type MutationAddCommandAllowlistEntryArgs = {
  agentId: Scalars['ID']['input'];
  pattern: Scalars['String']['input'];
};


export type MutationAssignSkillArgs = {
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
};


export type MutationBindAgentSkillConnectionArgs = {
  agentId: Scalars['ID']['input'];
  connectionId: Scalars['ID']['input'];
  provider: Scalars['String']['input'];
  skillId: Scalars['ID']['input'];
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


export type MutationDisableModelArgs = {
  modelId: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
};


export type MutationDismissUserInputRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEnableBedrockModelArgs = {
  modelId: Scalars['String']['input'];
};


export type MutationEnableModelArgs = {
  modelId: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
};


export type MutationRemoveCommandAllowlistEntryArgs = {
  agentId: Scalars['ID']['input'];
  pattern: Scalars['String']['input'];
};


export type MutationRemoveSkillArgs = {
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
};


export type MutationRequestFileUploadsArgs = {
  agentId: Scalars['String']['input'];
  files: Array<FileUploadRequest>;
  taskId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationResolveCommandApprovalArgs = {
  decision: CommandApprovalDecision;
  id: Scalars['ID']['input'];
};


export type MutationResolveUserInputRequestArgs = {
  action: Scalars['String']['input'];
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


export type MutationSubmitOAuthConnectionArgs = {
  accessToken: Scalars['String']['input'];
  accountId?: InputMaybe<Scalars['String']['input']>;
  clientId?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  providerId: Scalars['String']['input'];
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  scopes: Array<Scalars['String']['input']>;
  tokenUrl?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTriggerJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnbindAgentSkillConnectionArgs = {
  agentId: Scalars['ID']['input'];
  connectionId: Scalars['ID']['input'];
  provider: Scalars['String']['input'];
  skillId: Scalars['ID']['input'];
};


export type MutationUnretireAgentArgs = {
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


export type MutationUpdateProfileArgs = {
  input: ProfileInput;
};

export type OAuthConnectionMeta = {
  __typename?: 'OAuthConnectionMeta';
  accountId?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['String']['output']>;
  scopes: Array<Scalars['String']['output']>;
};

export type PendingInboxMessage = {
  __typename?: 'PendingInboxMessage';
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
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

export type ProviderModelInfo = {
  __typename?: 'ProviderModelInfo';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  agent?: Maybe<Agent>;
  agentJob?: Maybe<AgentJob>;
  agentJobs: Array<AgentJob>;
  agentLogs: AgentLogConnection;
  /** Skills assigned to a specific agent */
  agentSkills: Array<AgentSkill>;
  agents: Array<Agent>;
  allEnabledModels: Array<EnabledModelEntry>;
  avatars: Array<Avatar>;
  bedrockAvailableModels: Array<ModelInfo>;
  bedrockEnabledModels: Array<Scalars['String']['output']>;
  commandAllowlist: Array<AllowlistEntry>;
  defaultModel?: Maybe<DefaultModel>;
  enabledModels: Array<Scalars['String']['output']>;
  file?: Maybe<File>;
  globalSettings: GlobalSettings;
  integrationConnections: Array<IntegrationConnection>;
  integrationProviders: Array<IntegrationProvider>;
  pendingCommandApprovals: Array<CommandApproval>;
  pendingInboxMessages: Array<PendingInboxMessage>;
  profile: Profile;
  providerModels: Array<ProviderModelInfo>;
  /** Single skill template by ID */
  skillTemplate?: Maybe<SkillTemplate>;
  /** All skill templates from the catalog */
  skillTemplates: Array<SkillTemplate>;
  task?: Maybe<Task>;
  taskLogs: AgentLogConnection;
  tasks: TaskConnection;
  userInputRequests: Array<UserInputRequest>;
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


export type QueryAgentSkillsArgs = {
  agentId: Scalars['ID']['input'];
};


export type QueryCommandAllowlistArgs = {
  agentId: Scalars['ID']['input'];
};


export type QueryEnabledModelsArgs = {
  providerId: Scalars['String']['input'];
};


export type QueryFileArgs = {
  path: Scalars['String']['input'];
};


export type QueryPendingInboxMessagesArgs = {
  agentId: Scalars['ID']['input'];
  taskId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryProviderModelsArgs = {
  providerId: Scalars['String']['input'];
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

export type SkillConnectionRequirement = {
  __typename?: 'SkillConnectionRequirement';
  multi: Scalars['Boolean']['output'];
  optional: Scalars['Boolean']['output'];
  provider: Scalars['String']['output'];
  providerName: Scalars['String']['output'];
  reason: Scalars['String']['output'];
  requestedScopes?: Maybe<Array<Scalars['String']['output']>>;
};

export type SkillConnectionStatus = {
  __typename?: 'SkillConnectionStatus';
  boundConnectionIds: Array<Scalars['String']['output']>;
  connected: Scalars['Boolean']['output'];
  multi: Scalars['Boolean']['output'];
  optional: Scalars['Boolean']['output'];
  provider: Scalars['String']['output'];
  providerName: Scalars['String']['output'];
  reason: Scalars['String']['output'];
};

export type SkillTemplate = {
  __typename?: 'SkillTemplate';
  allowedCommands?: Maybe<Array<Scalars['String']['output']>>;
  author?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  connections: Array<SkillConnectionRequirement>;
  description: Scalars['String']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  hasInstall: Scalars['Boolean']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  install?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  tags?: Maybe<Array<Scalars['String']['output']>>;
  version: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  _empty?: Maybe<Scalars['String']['output']>;
  agentLogCreated: AgentLog;
  agentUpdated: Agent;
  agentsUpdated: Agent;
  jobCreated: AgentJob;
  jobTaskCreated: Task;
  pendingItemsUpdated: Scalars['Boolean']['output'];
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


export type SubscriptionJobTaskCreatedArgs = {
  jobId: Scalars['ID']['input'];
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
  attachments: Array<Attachment>;
  completedAt?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  /** @deprecated Use attachments instead */
  documents: Array<Document>;
  /** @deprecated Use attachments instead */
  files: Array<File>;
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

export enum ToolName {
  AttachFile = 'attachFile',
  AttachLink = 'attachLink',
  Authenticate = 'authenticate',
  CreateDocument = 'createDocument',
  DelegateTask = 'delegateTask',
  EnsureSandbox = 'ensureSandbox',
  ListJobs = 'listJobs',
  PostToMainLane = 'postToMainLane',
  ReadDocument = 'readDocument',
  ReadSkill = 'readSkill',
  ReadSkillReference = 'readSkillReference',
  RecallMemory = 'recallMemory',
  RequestUserInput = 'requestUserInput',
  RunCommand = 'runCommand',
  SaveMemory = 'saveMemory',
  ScheduleJob = 'scheduleJob',
  UpdateDocument = 'updateDocument',
  UpdateJob = 'updateJob',
  UpdateTaskMessage = 'updateTaskMessage',
  ViewImage = 'viewImage',
  WebFetch = 'webFetch',
  WebSearch = 'webSearch'
}

export type UnknownRender = {
  __typename?: 'UnknownRender';
  mimeType?: Maybe<Scalars['String']['output']>;
  sizeBytes: Scalars['Int']['output'];
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
  paused?: InputMaybe<Scalars['Boolean']['input']>;
  recurrence?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type UserInputRequest = {
  __typename?: 'UserInputRequest';
  actions: Array<UserInputRequestAction>;
  agent: Agent;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  resolvedAction?: Maybe<Scalars['String']['output']>;
  status: UserInputRequestStatus;
  turnId?: Maybe<Scalars['String']['output']>;
};

export type UserInputRequestAction = {
  __typename?: 'UserInputRequestAction';
  label: Scalars['String']['output'];
  style: Scalars['String']['output'];
};

export enum UserInputRequestStatus {
  Dismissed = 'DISMISSED',
  Pending = 'PENDING',
  Resolved = 'RESOLVED'
}

export type VideoRender = {
  __typename?: 'VideoRender';
  durationSeconds?: Maybe<Scalars['Float']['output']>;
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};


export type VideoRenderThumbnailUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
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

export type IntegrationProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationProvidersQuery = { __typename?: 'Query', integrationProviders: Array<{ __typename?: 'IntegrationProvider', id: string, service: string, connectionType: string, hasConnection: boolean }> };

export type SubmitOAuthConnectionMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  accessToken: Scalars['String']['input'];
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  scopes: Array<Scalars['String']['input']> | Scalars['String']['input'];
  accountId?: InputMaybe<Scalars['String']['input']>;
}>;


export type SubmitOAuthConnectionMutation = { __typename?: 'Mutation', submitOAuthConnection: string };

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

export const IntegrationProvidersDocument = new TypedDocumentString(`
    query IntegrationProviders {
  integrationProviders {
    id
    service
    connectionType
    hasConnection
  }
}
    `) as unknown as TypedDocumentString<IntegrationProvidersQuery, IntegrationProvidersQueryVariables>;
export const SubmitOAuthConnectionDocument = new TypedDocumentString(`
    mutation SubmitOAuthConnection($providerId: String!, $accessToken: String!, $refreshToken: String, $expiresAt: String, $scopes: [String!]!, $accountId: String) {
  submitOAuthConnection(
    providerId: $providerId
    accessToken: $accessToken
    refreshToken: $refreshToken
    expiresAt: $expiresAt
    scopes: $scopes
    accountId: $accountId
  )
}
    `) as unknown as TypedDocumentString<SubmitOAuthConnectionMutation, SubmitOAuthConnectionMutationVariables>;