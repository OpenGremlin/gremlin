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
  enabled: Scalars['Boolean']['output'];
  idleTimeoutMinutes?: Maybe<Scalars['Int']['output']>;
};

export type AgentSandboxConfigInput = {
  alwaysOn?: InputMaybe<Scalars['Boolean']['input']>;
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
  dismissNotification?: Maybe<Notification>;
  enableBedrockModel: Scalars['Boolean']['output'];
  enableModel: Scalars['Boolean']['output'];
  /** Remove a skill from an agent */
  removeSkill: Scalars['Boolean']['output'];
  requestFileUploads: Array<FileUploadUrl>;
  resolveNotification?: Maybe<Notification>;
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


export type MutationDismissNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEnableBedrockModelArgs = {
  modelId: Scalars['String']['input'];
};


export type MutationEnableModelArgs = {
  modelId: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
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


export type MutationSubmitOAuthConnectionArgs = {
  accessToken: Scalars['String']['input'];
  accountId?: InputMaybe<Scalars['String']['input']>;
  clientId?: InputMaybe<Scalars['String']['input']>;
  clientSecret?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  providerId: Scalars['String']['input'];
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  scopes: Array<Scalars['String']['input']>;
  tokenAuthMethod?: InputMaybe<Scalars['String']['input']>;
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
  defaultModel?: Maybe<DefaultModel>;
  enabledModels: Array<Scalars['String']['output']>;
  file?: Maybe<File>;
  globalSettings: GlobalSettings;
  integrationConnections: Array<IntegrationConnection>;
  integrationProviders: Array<IntegrationProvider>;
  notifications: Array<Notification>;
  profile: Profile;
  providerModels: Array<ProviderModelInfo>;
  /** Single skill template by ID */
  skillTemplate?: Maybe<SkillTemplate>;
  /** All skill templates from the catalog */
  skillTemplates: Array<SkillTemplate>;
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


export type QueryAgentSkillsArgs = {
  agentId: Scalars['ID']['input'];
};


export type QueryEnabledModelsArgs = {
  providerId: Scalars['String']['input'];
};


export type QueryFileArgs = {
  path: Scalars['String']['input'];
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
  author?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  connections: Array<SkillConnectionRequirement>;
  description: Scalars['String']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  hasInstall: Scalars['Boolean']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
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
  RequestApproval = 'requestApproval',
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

export type AgentLogsQueryVariables = Exact<{
  agentId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type AgentLogsQuery = { __typename?: 'Query', agentLogs: { __typename?: 'AgentLogConnection', edges: Array<{ __typename?: 'AgentLogEdge', cursor: string, node: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           }> } }>, pageInfo: { __typename?: 'AgentLogPageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type SendMessageMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  taskId?: InputMaybe<Scalars['String']['input']>;
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage: { __typename?: 'SendMessageResult', queued: boolean, content: string } };

export type RequestFileUploadsMutationVariables = Exact<{
  agentId: Scalars['String']['input'];
  taskId?: InputMaybe<Scalars['String']['input']>;
  files: Array<FileUploadRequest> | FileUploadRequest;
}>;


export type RequestFileUploadsMutation = { __typename?: 'Mutation', requestFileUploads: Array<{ __typename?: 'FileUploadUrl', uploadId: string, presignedUrl: string, key: string }> };

export type CompleteFileUploadMutationVariables = Exact<{
  input: CompleteFileUploadInput;
}>;


export type CompleteFileUploadMutation = { __typename?: 'Mutation', completeFileUpload: { __typename?: 'CompletedFileUpload', path: string, filename: string, sizeBytes: number, contentType: string } };

export type AgentLogCreatedSubscriptionVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentLogCreatedSubscription = { __typename?: 'Subscription', agentLogCreated: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
        | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
        | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
       }> } };

export type AgentDetailFragment = { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, soul: string, retired: boolean, ttsVoice?: string | null, config?: { __typename?: 'AgentConfig', model?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, sandbox?: { __typename?: 'AgentSandboxConfig', enabled: boolean, idleTimeoutMinutes?: number | null, alwaysOn?: boolean | null } | null, webSearch?: { __typename?: 'AgentWebSearchConfig', enabled: boolean, provider?: string | null } | null, viewImage?: { __typename?: 'AgentViewImageConfig', enabled: boolean } | null } | null };

export type AgentsQueryVariables = Exact<{ [key: string]: never; }>;


export type AgentsQuery = { __typename?: 'Query', agents: Array<{ __typename?: 'Agent', id: string, name: string, soul: string, retired: boolean }> };

export type AgentQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AgentQuery = { __typename?: 'Query', agent?: { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, soul: string, retired: boolean, ttsVoice?: string | null, config?: { __typename?: 'AgentConfig', model?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, sandbox?: { __typename?: 'AgentSandboxConfig', enabled: boolean, idleTimeoutMinutes?: number | null, alwaysOn?: boolean | null } | null, webSearch?: { __typename?: 'AgentWebSearchConfig', enabled: boolean, provider?: string | null } | null, viewImage?: { __typename?: 'AgentViewImageConfig', enabled: boolean } | null } | null } | null };

export type UpdateAgentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAgentInput;
}>;


export type UpdateAgentMutation = { __typename?: 'Mutation', updateAgent?: { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, soul: string, retired: boolean, ttsVoice?: string | null, config?: { __typename?: 'AgentConfig', model?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, sandbox?: { __typename?: 'AgentSandboxConfig', enabled: boolean, idleTimeoutMinutes?: number | null, alwaysOn?: boolean | null } | null, webSearch?: { __typename?: 'AgentWebSearchConfig', enabled: boolean, provider?: string | null } | null, viewImage?: { __typename?: 'AgentViewImageConfig', enabled: boolean } | null } | null } | null };

export type CreateAgentMutationVariables = Exact<{
  input: CreateAgentInput;
}>;


export type CreateAgentMutation = { __typename?: 'Mutation', createAgent: { __typename?: 'Agent', id: string, name: string, soul: string } };

export type RetireAgentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RetireAgentMutation = { __typename?: 'Mutation', retireAgent: { __typename?: 'Agent', id: string, retired: boolean } };

export type UnretireAgentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnretireAgentMutation = { __typename?: 'Mutation', unretireAgent: { __typename?: 'Agent', id: string, retired: boolean } };

export type AgentUpdatedSubscriptionVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentUpdatedSubscription = { __typename?: 'Subscription', agentUpdated: { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, soul: string, retired: boolean, ttsVoice?: string | null, config?: { __typename?: 'AgentConfig', model?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, sandbox?: { __typename?: 'AgentSandboxConfig', enabled: boolean, idleTimeoutMinutes?: number | null, alwaysOn?: boolean | null } | null, webSearch?: { __typename?: 'AgentWebSearchConfig', enabled: boolean, provider?: string | null } | null, viewImage?: { __typename?: 'AgentViewImageConfig', enabled: boolean } | null } | null } };

export type FileFieldsFragment = { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
    | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
    | { __typename: 'CodeRender', content: string, language: string }
    | { __typename: 'DocumentRender', markdown: string, title?: string | null }
    | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
    | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
    | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
   };

export type IntegrationProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationProvidersQuery = { __typename?: 'Query', integrationProviders: Array<{ __typename?: 'IntegrationProvider', id: string, service: string, category: string, description: string, connectionType: string, connectionCount: number, hasConnection: boolean, availableScopes: Array<{ __typename?: 'AvailableScope', scope: string, label: string }>, models?: Array<{ __typename?: 'ModelInfo', id: string, name: string, contextWindow: number, maxTokens: number, reasoning: boolean, inputCost?: number | null, outputCost?: number | null }> | null }>, defaultModel?: { __typename?: 'DefaultModel', providerId: string, modelId: string } | null };

export type IntegrationConnectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationConnectionsQuery = { __typename?: 'Query', integrationConnections: Array<{ __typename?: 'IntegrationConnection', id: string, providerId: string, connectionType: string, connectedAt: string, isRevoked: boolean, provider: { __typename?: 'IntegrationProvider', id: string, service: string, description: string }, meta:
      | { __typename: 'ApiKeyConnectionMeta', accountId?: string | null }
      | { __typename: 'OAuthConnectionMeta', accountId?: string | null, scopes: Array<string>, expiresAt?: string | null }
     }> };

export type ConnectApiKeyMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  apiKey: Scalars['String']['input'];
}>;


export type ConnectApiKeyMutation = { __typename?: 'Mutation', connectApiKey: { __typename?: 'ConnectApiKeyResult', connectionId: string, models: Array<{ __typename?: 'ProviderModelInfo', id: string, name: string }> } };

export type ProviderModelsQueryVariables = Exact<{
  providerId: Scalars['String']['input'];
}>;


export type ProviderModelsQuery = { __typename?: 'Query', providerModels: Array<{ __typename?: 'ProviderModelInfo', id: string, name: string }> };

export type RevokeConnectionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RevokeConnectionMutation = { __typename?: 'Mutation', revokeIntegrationConnection: boolean };

export type SetDefaultModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type SetDefaultModelMutation = { __typename?: 'Mutation', setDefaultModel: boolean };

export type EnabledModelsQueryVariables = Exact<{
  providerId: Scalars['String']['input'];
}>;


export type EnabledModelsQuery = { __typename?: 'Query', enabledModels: Array<string> };

export type AllEnabledModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type AllEnabledModelsQuery = { __typename?: 'Query', allEnabledModels: Array<{ __typename?: 'EnabledModelEntry', providerId: string, modelId: string, modelName?: string | null }> };

export type EnableModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type EnableModelMutation = { __typename?: 'Mutation', enableModel: boolean };

export type DisableModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type DisableModelMutation = { __typename?: 'Mutation', disableModel: boolean };

export type BedrockEnabledModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type BedrockEnabledModelsQuery = { __typename?: 'Query', bedrockEnabledModels: Array<string> };

export type BedrockAvailableModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type BedrockAvailableModelsQuery = { __typename?: 'Query', bedrockAvailableModels: Array<{ __typename?: 'ModelInfo', id: string, name: string, contextWindow: number, maxTokens: number, reasoning: boolean, inputCost?: number | null, outputCost?: number | null }> };

export type EnableBedrockModelMutationVariables = Exact<{
  modelId: Scalars['String']['input'];
}>;


export type EnableBedrockModelMutation = { __typename?: 'Mutation', enableBedrockModel: boolean };

export type DisableBedrockModelMutationVariables = Exact<{
  modelId: Scalars['String']['input'];
}>;


export type DisableBedrockModelMutation = { __typename?: 'Mutation', disableBedrockModel: boolean };

export type SubmitOAuthConnectionMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  accessToken: Scalars['String']['input'];
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  scopes: Array<Scalars['String']['input']> | Scalars['String']['input'];
  accountId?: InputMaybe<Scalars['String']['input']>;
  clientId?: InputMaybe<Scalars['String']['input']>;
  clientSecret?: InputMaybe<Scalars['String']['input']>;
  tokenUrl?: InputMaybe<Scalars['String']['input']>;
  tokenAuthMethod?: InputMaybe<Scalars['String']['input']>;
}>;


export type SubmitOAuthConnectionMutation = { __typename?: 'Mutation', submitOAuthConnection: string };

export type AgentJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type AgentJobsQuery = { __typename?: 'Query', agentJobs: Array<{ __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string } }> };

export type AgentJobQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AgentJobQuery = { __typename?: 'Query', agentJob?: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string }, tasks: Array<{ __typename?: 'Task', id: string, title: string, createdAt: string, agent: { __typename?: 'Agent', id: string } }> } | null };

export type DeleteAgentJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAgentJobMutation = { __typename?: 'Mutation', deleteAgentJob?: { __typename?: 'AgentJob', id: string } | null };

export type UpdateAgentJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAgentJobInput;
}>;


export type UpdateAgentJobMutation = { __typename?: 'Mutation', updateAgentJob?: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string } } | null };

export type JobTaskCreatedSubscriptionVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type JobTaskCreatedSubscription = { __typename?: 'Subscription', jobTaskCreated: { __typename?: 'Task', id: string, title: string, createdAt: string, agent: { __typename?: 'Agent', id: string } } };

export type TriggerJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TriggerJobMutation = { __typename?: 'Mutation', triggerJob: boolean };

export type JobCreatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type JobCreatedSubscription = { __typename?: 'Subscription', jobCreated: { __typename?: 'AgentJob', id: string } };

export type CreateAgentJobMutationVariables = Exact<{
  input: CreateAgentJobInput;
}>;


export type CreateAgentJobMutation = { __typename?: 'Mutation', createAgentJob: { __typename?: 'AgentJob', id: string } };

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

export type GlobalSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GlobalSettingsQuery = { __typename?: 'Query', globalSettings: { __typename?: 'GlobalSettings', signupDisabled: boolean } };

export type UpdateGlobalSettingsMutationVariables = Exact<{
  signupDisabled?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateGlobalSettingsMutation = { __typename?: 'Mutation', updateGlobalSettings: { __typename?: 'GlobalSettings', signupDisabled: boolean } };

export type SkillTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type SkillTemplatesQuery = { __typename?: 'Query', skillTemplates: Array<{ __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> }> };

export type SkillTemplateQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SkillTemplateQuery = { __typename?: 'Query', skillTemplate?: { __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> } | null };

export type AgentSkillsQueryVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentSkillsQuery = { __typename?: 'Query', agentSkills: Array<{ __typename?: 'AgentSkill', skillId: string, agentId: string, assignedAt: string, template?: { __typename?: 'SkillTemplate', id: string, name: string, description: string, version: string, category?: string | null, icon?: string | null, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean }> } | null, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, boundConnectionIds: Array<string>, connected: boolean }> }> };

export type AssignSkillMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
}>;


export type AssignSkillMutation = { __typename?: 'Mutation', assignSkill: { __typename?: 'AgentSkill', skillId: string, agentId: string, assignedAt: string, template?: { __typename?: 'SkillTemplate', id: string, name: string, description: string, version: string, category?: string | null, icon?: string | null } | null, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, boundConnectionIds: Array<string>, connected: boolean }> } };

export type RemoveSkillMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
}>;


export type RemoveSkillMutation = { __typename?: 'Mutation', removeSkill: boolean };

export type BindAgentSkillConnectionMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
  provider: Scalars['String']['input'];
  connectionId: Scalars['ID']['input'];
}>;


export type BindAgentSkillConnectionMutation = { __typename?: 'Mutation', bindAgentSkillConnection: { __typename?: 'AgentSkill', skillId: string, agentId: string, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, boundConnectionIds: Array<string>, connected: boolean }> } };

export type UnbindAgentSkillConnectionMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
  provider: Scalars['String']['input'];
  connectionId: Scalars['ID']['input'];
}>;


export type UnbindAgentSkillConnectionMutation = { __typename?: 'Mutation', unbindAgentSkillConnection: { __typename?: 'AgentSkill', skillId: string, agentId: string, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, boundConnectionIds: Array<string>, connected: boolean }> } };

export type TasksQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type TasksQuery = { __typename?: 'Query', tasks: { __typename?: 'TaskConnection', edges: Array<{ __typename?: 'TaskEdge', cursor: string, node: { __typename?: 'Task', id: string, title: string, message?: string | null, createdAt: string, imageUrl?: string | null, agent: { __typename?: 'Agent', id: string, name: string }, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           }> } }>, pageInfo: { __typename?: 'TaskPageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type TaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TaskQuery = { __typename?: 'Query', task?: { __typename?: 'Task', id: string, title: string, message?: string | null, createdAt: string, updatedAt: string, completedAt?: string | null, imageUrl?: string | null, agent: { __typename?: 'Agent', id: string }, attachments: Array<
      | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           } }
      | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
    >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
        | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
        | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
       }> } | null };

export type TaskLogsQueryVariables = Exact<{
  taskId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type TaskLogsQuery = { __typename?: 'Query', taskLogs: { __typename?: 'AgentLogConnection', edges: Array<{ __typename?: 'AgentLogEdge', cursor: string, node: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           }> } }>, pageInfo: { __typename?: 'AgentLogPageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type TaskLogCreatedSubscriptionVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type TaskLogCreatedSubscription = { __typename?: 'Subscription', taskLogCreated: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, taskId?: string | null, createdAt: string, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
        | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
        | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
       }> } };

export type TaskUpdatedSubscriptionVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type TaskUpdatedSubscription = { __typename?: 'Subscription', taskUpdated: { __typename?: 'Task', id: string, title: string, message?: string | null, updatedAt: string, completedAt?: string | null, imageUrl?: string | null, attachments: Array<
      | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           } }
      | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
    >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
        | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
        | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
       }> } };

export type SandboxOutputSubscriptionVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type SandboxOutputSubscription = { __typename?: 'Subscription', sandboxOutput: { __typename?: 'SandboxOutput', commandId: string, stream: string, data: string, done?: boolean | null, exitCode?: number | null } };

export type WorkspaceEntriesQueryVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type WorkspaceEntriesQuery = { __typename?: 'Query', workspaceEntries: Array<{ __typename?: 'WorkspaceEntry', name: string, path: string, isDirectory: boolean, size?: number | null, modifiedAt?: string | null }> };

export type WorkspaceFileQueryVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type WorkspaceFileQuery = { __typename?: 'Query', workspaceFile?: string | null };

export type FileQueryVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type FileQuery = { __typename?: 'Query', file?: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
      | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
      | { __typename: 'CodeRender', content: string, language: string }
      | { __typename: 'DocumentRender', markdown: string, title?: string | null }
      | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null }
      | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
      | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
     } | null };

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
export const AgentDetailFragmentDoc = new TypedDocumentString(`
    fragment AgentDetail on Agent {
  id
  name
  avatar
  portraitId
  imageUrl(width: 200)
  soul
  retired
  ttsVoice
  config {
    model {
      type
      modelId
      connectionId
    }
    sandbox {
      enabled
      idleTimeoutMinutes
      alwaysOn
    }
    webSearch {
      enabled
      provider
    }
    viewImage {
      enabled
    }
  }
}
    `, {"fragmentName":"AgentDetail"}) as unknown as TypedDocumentString<AgentDetailFragment, unknown>;
export const FileFieldsFragmentDoc = new TypedDocumentString(`
    fragment FileFields on File {
  path
  name
  sizeBytes
  mimeType
  modifiedAt
  render {
    __typename
    ... on DocumentRender {
      markdown
      title
    }
    ... on CodeRender {
      content
      language
    }
    ... on ImageRender {
      url(width: 800)
      width
      height
      aspectRatio
    }
    ... on AudioRender {
      url
      durationSeconds
    }
    ... on VideoRender {
      url
      thumbnailUrl(width: 400)
      durationSeconds
    }
    ... on UnknownRender {
      mimeType
      sizeBytes
    }
  }
}
    `, {"fragmentName":"FileFields"}) as unknown as TypedDocumentString<FileFieldsFragment, unknown>;
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
        files {
          ...FileFields
        }
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
    fragment FileFields on File {
  path
  name
  sizeBytes
  mimeType
  modifiedAt
  render {
    __typename
    ... on DocumentRender {
      markdown
      title
    }
    ... on CodeRender {
      content
      language
    }
    ... on ImageRender {
      url(width: 800)
      width
      height
      aspectRatio
    }
    ... on AudioRender {
      url
      durationSeconds
    }
    ... on VideoRender {
      url
      thumbnailUrl(width: 400)
      durationSeconds
    }
    ... on UnknownRender {
      mimeType
      sizeBytes
    }
  }
}`) as unknown as TypedDocumentString<AgentLogsQuery, AgentLogsQueryVariables>;
export const SendMessageDocument = new TypedDocumentString(`
    mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {
  sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {
    queued
    content
  }
}
    `) as unknown as TypedDocumentString<SendMessageMutation, SendMessageMutationVariables>;
export const RequestFileUploadsDocument = new TypedDocumentString(`
    mutation RequestFileUploads($agentId: String!, $taskId: String, $files: [FileUploadRequest!]!) {
  requestFileUploads(agentId: $agentId, taskId: $taskId, files: $files) {
    uploadId
    presignedUrl
    key
  }
}
    `) as unknown as TypedDocumentString<RequestFileUploadsMutation, RequestFileUploadsMutationVariables>;
export const CompleteFileUploadDocument = new TypedDocumentString(`
    mutation CompleteFileUpload($input: CompleteFileUploadInput!) {
  completeFileUpload(input: $input) {
    path
    filename
    sizeBytes
    contentType
  }
}
    `) as unknown as TypedDocumentString<CompleteFileUploadMutation, CompleteFileUploadMutationVariables>;
export const AgentLogCreatedDocument = new TypedDocumentString(`
    subscription AgentLogCreated($agentId: ID!) {
  agentLogCreated(agentId: $agentId) {
    id
    role
    content
    toolName
    toolInput
    toolResult
    files {
      ...FileFields
    }
    taskId
    createdAt
  }
}
    fragment FileFields on File {
  path
  name
  sizeBytes
  mimeType
  modifiedAt
  render {
    __typename
    ... on DocumentRender {
      markdown
      title
    }
    ... on CodeRender {
      content
      language
    }
    ... on ImageRender {
      url(width: 800)
      width
      height
      aspectRatio
    }
    ... on AudioRender {
      url
      durationSeconds
    }
    ... on VideoRender {
      url
      thumbnailUrl(width: 400)
      durationSeconds
    }
    ... on UnknownRender {
      mimeType
      sizeBytes
    }
  }
}`) as unknown as TypedDocumentString<AgentLogCreatedSubscription, AgentLogCreatedSubscriptionVariables>;
export const AgentsDocument = new TypedDocumentString(`
    query Agents {
  agents {
    id
    name
    soul
    retired
  }
}
    `) as unknown as TypedDocumentString<AgentsQuery, AgentsQueryVariables>;
export const AgentDocument = new TypedDocumentString(`
    query Agent($id: ID!) {
  agent(id: $id) {
    ...AgentDetail
  }
}
    fragment AgentDetail on Agent {
  id
  name
  avatar
  portraitId
  imageUrl(width: 200)
  soul
  retired
  ttsVoice
  config {
    model {
      type
      modelId
      connectionId
    }
    sandbox {
      enabled
      idleTimeoutMinutes
      alwaysOn
    }
    webSearch {
      enabled
      provider
    }
    viewImage {
      enabled
    }
  }
}`) as unknown as TypedDocumentString<AgentQuery, AgentQueryVariables>;
export const UpdateAgentDocument = new TypedDocumentString(`
    mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {
  updateAgent(id: $id, input: $input) {
    ...AgentDetail
  }
}
    fragment AgentDetail on Agent {
  id
  name
  avatar
  portraitId
  imageUrl(width: 200)
  soul
  retired
  ttsVoice
  config {
    model {
      type
      modelId
      connectionId
    }
    sandbox {
      enabled
      idleTimeoutMinutes
      alwaysOn
    }
    webSearch {
      enabled
      provider
    }
    viewImage {
      enabled
    }
  }
}`) as unknown as TypedDocumentString<UpdateAgentMutation, UpdateAgentMutationVariables>;
export const CreateAgentDocument = new TypedDocumentString(`
    mutation CreateAgent($input: CreateAgentInput!) {
  createAgent(input: $input) {
    id
    name
    soul
  }
}
    `) as unknown as TypedDocumentString<CreateAgentMutation, CreateAgentMutationVariables>;
export const RetireAgentDocument = new TypedDocumentString(`
    mutation RetireAgent($id: ID!) {
  retireAgent(id: $id) {
    id
    retired
  }
}
    `) as unknown as TypedDocumentString<RetireAgentMutation, RetireAgentMutationVariables>;
export const UnretireAgentDocument = new TypedDocumentString(`
    mutation UnretireAgent($id: ID!) {
  unretireAgent(id: $id) {
    id
    retired
  }
}
    `) as unknown as TypedDocumentString<UnretireAgentMutation, UnretireAgentMutationVariables>;
export const AgentUpdatedDocument = new TypedDocumentString(`
    subscription AgentUpdated($agentId: ID!) {
  agentUpdated(agentId: $agentId) {
    ...AgentDetail
  }
}
    fragment AgentDetail on Agent {
  id
  name
  avatar
  portraitId
  imageUrl(width: 200)
  soul
  retired
  ttsVoice
  config {
    model {
      type
      modelId
      connectionId
    }
    sandbox {
      enabled
      idleTimeoutMinutes
      alwaysOn
    }
    webSearch {
      enabled
      provider
    }
    viewImage {
      enabled
    }
  }
}`) as unknown as TypedDocumentString<AgentUpdatedSubscription, AgentUpdatedSubscriptionVariables>;
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
    provider {
      id
      service
      description
    }
    connectionType
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
export const ConnectApiKeyDocument = new TypedDocumentString(`
    mutation ConnectApiKey($providerId: String!, $apiKey: String!) {
  connectApiKey(providerId: $providerId, apiKey: $apiKey) {
    connectionId
    models {
      id
      name
    }
  }
}
    `) as unknown as TypedDocumentString<ConnectApiKeyMutation, ConnectApiKeyMutationVariables>;
export const ProviderModelsDocument = new TypedDocumentString(`
    query ProviderModels($providerId: String!) {
  providerModels(providerId: $providerId) {
    id
    name
  }
}
    `) as unknown as TypedDocumentString<ProviderModelsQuery, ProviderModelsQueryVariables>;
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
export const EnabledModelsDocument = new TypedDocumentString(`
    query EnabledModels($providerId: String!) {
  enabledModels(providerId: $providerId)
}
    `) as unknown as TypedDocumentString<EnabledModelsQuery, EnabledModelsQueryVariables>;
export const AllEnabledModelsDocument = new TypedDocumentString(`
    query AllEnabledModels {
  allEnabledModels {
    providerId
    modelId
    modelName
  }
}
    `) as unknown as TypedDocumentString<AllEnabledModelsQuery, AllEnabledModelsQueryVariables>;
export const EnableModelDocument = new TypedDocumentString(`
    mutation EnableModel($providerId: String!, $modelId: String!) {
  enableModel(providerId: $providerId, modelId: $modelId)
}
    `) as unknown as TypedDocumentString<EnableModelMutation, EnableModelMutationVariables>;
export const DisableModelDocument = new TypedDocumentString(`
    mutation DisableModel($providerId: String!, $modelId: String!) {
  disableModel(providerId: $providerId, modelId: $modelId)
}
    `) as unknown as TypedDocumentString<DisableModelMutation, DisableModelMutationVariables>;
export const BedrockEnabledModelsDocument = new TypedDocumentString(`
    query BedrockEnabledModels {
  bedrockEnabledModels
}
    `) as unknown as TypedDocumentString<BedrockEnabledModelsQuery, BedrockEnabledModelsQueryVariables>;
export const BedrockAvailableModelsDocument = new TypedDocumentString(`
    query BedrockAvailableModels {
  bedrockAvailableModels {
    id
    name
    contextWindow
    maxTokens
    reasoning
    inputCost
    outputCost
  }
}
    `) as unknown as TypedDocumentString<BedrockAvailableModelsQuery, BedrockAvailableModelsQueryVariables>;
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
export const SubmitOAuthConnectionDocument = new TypedDocumentString(`
    mutation SubmitOAuthConnection($providerId: String!, $accessToken: String!, $refreshToken: String, $expiresAt: String, $scopes: [String!]!, $accountId: String, $clientId: String, $clientSecret: String, $tokenUrl: String, $tokenAuthMethod: String) {
  submitOAuthConnection(
    providerId: $providerId
    accessToken: $accessToken
    refreshToken: $refreshToken
    expiresAt: $expiresAt
    scopes: $scopes
    accountId: $accountId
    clientId: $clientId
    clientSecret: $clientSecret
    tokenUrl: $tokenUrl
    tokenAuthMethod: $tokenAuthMethod
  )
}
    `) as unknown as TypedDocumentString<SubmitOAuthConnectionMutation, SubmitOAuthConnectionMutationVariables>;
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
    paused
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
    paused
    lastRun
    nextRun
    tasks {
      id
      agent {
        id
      }
      title
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
    paused
    lastRun
    nextRun
  }
}
    `) as unknown as TypedDocumentString<UpdateAgentJobMutation, UpdateAgentJobMutationVariables>;
export const JobTaskCreatedDocument = new TypedDocumentString(`
    subscription JobTaskCreated($jobId: ID!) {
  jobTaskCreated(jobId: $jobId) {
    id
    agent {
      id
    }
    title
    createdAt
  }
}
    `) as unknown as TypedDocumentString<JobTaskCreatedSubscription, JobTaskCreatedSubscriptionVariables>;
export const TriggerJobDocument = new TypedDocumentString(`
    mutation TriggerJob($id: ID!) {
  triggerJob(id: $id)
}
    `) as unknown as TypedDocumentString<TriggerJobMutation, TriggerJobMutationVariables>;
export const JobCreatedDocument = new TypedDocumentString(`
    subscription JobCreated {
  jobCreated {
    id
  }
}
    `) as unknown as TypedDocumentString<JobCreatedSubscription, JobCreatedSubscriptionVariables>;
export const CreateAgentJobDocument = new TypedDocumentString(`
    mutation CreateAgentJob($input: CreateAgentJobInput!) {
  createAgentJob(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<CreateAgentJobMutation, CreateAgentJobMutationVariables>;
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
export const GlobalSettingsDocument = new TypedDocumentString(`
    query GlobalSettings {
  globalSettings {
    signupDisabled
  }
}
    `) as unknown as TypedDocumentString<GlobalSettingsQuery, GlobalSettingsQueryVariables>;
export const UpdateGlobalSettingsDocument = new TypedDocumentString(`
    mutation UpdateGlobalSettings($signupDisabled: Boolean) {
  updateGlobalSettings(signupDisabled: $signupDisabled) {
    signupDisabled
  }
}
    `) as unknown as TypedDocumentString<UpdateGlobalSettingsMutation, UpdateGlobalSettingsMutationVariables>;
export const SkillTemplatesDocument = new TypedDocumentString(`
    query SkillTemplates {
  skillTemplates {
    id
    name
    displayName
    description
    version
    author
    category
    icon
    tags
    hasInstall
    connections {
      provider
      providerName
      reason
      optional
      multi
      requestedScopes
    }
  }
}
    `) as unknown as TypedDocumentString<SkillTemplatesQuery, SkillTemplatesQueryVariables>;
export const SkillTemplateDocument = new TypedDocumentString(`
    query SkillTemplate($id: ID!) {
  skillTemplate(id: $id) {
    id
    name
    displayName
    description
    version
    author
    category
    icon
    tags
    hasInstall
    connections {
      provider
      providerName
      reason
      optional
      multi
      requestedScopes
    }
  }
}
    `) as unknown as TypedDocumentString<SkillTemplateQuery, SkillTemplateQueryVariables>;
export const AgentSkillsDocument = new TypedDocumentString(`
    query AgentSkills($agentId: ID!) {
  agentSkills(agentId: $agentId) {
    skillId
    agentId
    assignedAt
    template {
      id
      name
      description
      version
      category
      icon
      connections {
        provider
        providerName
        reason
        optional
        multi
      }
    }
    connectionStatuses {
      provider
      providerName
      reason
      optional
      multi
      boundConnectionIds
      connected
    }
  }
}
    `) as unknown as TypedDocumentString<AgentSkillsQuery, AgentSkillsQueryVariables>;
export const AssignSkillDocument = new TypedDocumentString(`
    mutation AssignSkill($agentId: ID!, $skillId: ID!) {
  assignSkill(agentId: $agentId, skillId: $skillId) {
    skillId
    agentId
    assignedAt
    template {
      id
      name
      description
      version
      category
      icon
    }
    connectionStatuses {
      provider
      providerName
      reason
      optional
      multi
      boundConnectionIds
      connected
    }
  }
}
    `) as unknown as TypedDocumentString<AssignSkillMutation, AssignSkillMutationVariables>;
export const RemoveSkillDocument = new TypedDocumentString(`
    mutation RemoveSkill($agentId: ID!, $skillId: ID!) {
  removeSkill(agentId: $agentId, skillId: $skillId)
}
    `) as unknown as TypedDocumentString<RemoveSkillMutation, RemoveSkillMutationVariables>;
export const BindAgentSkillConnectionDocument = new TypedDocumentString(`
    mutation BindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {
  bindAgentSkillConnection(
    agentId: $agentId
    skillId: $skillId
    provider: $provider
    connectionId: $connectionId
  ) {
    skillId
    agentId
    connectionStatuses {
      provider
      boundConnectionIds
      connected
    }
  }
}
    `) as unknown as TypedDocumentString<BindAgentSkillConnectionMutation, BindAgentSkillConnectionMutationVariables>;
export const UnbindAgentSkillConnectionDocument = new TypedDocumentString(`
    mutation UnbindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {
  unbindAgentSkillConnection(
    agentId: $agentId
    skillId: $skillId
    provider: $provider
    connectionId: $connectionId
  ) {
    skillId
    agentId
    connectionStatuses {
      provider
      boundConnectionIds
      connected
    }
  }
}
    `) as unknown as TypedDocumentString<UnbindAgentSkillConnectionMutation, UnbindAgentSkillConnectionMutationVariables>;
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
        message
        createdAt
        imageUrl(width: 200)
        files {
          ...FileFields
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
    fragment FileFields on File {
  path
  name
  sizeBytes
  mimeType
  modifiedAt
  render {
    __typename
    ... on DocumentRender {
      markdown
      title
    }
    ... on CodeRender {
      content
      language
    }
    ... on ImageRender {
      url(width: 800)
      width
      height
      aspectRatio
    }
    ... on AudioRender {
      url
      durationSeconds
    }
    ... on VideoRender {
      url
      thumbnailUrl(width: 400)
      durationSeconds
    }
    ... on UnknownRender {
      mimeType
      sizeBytes
    }
  }
}`) as unknown as TypedDocumentString<TasksQuery, TasksQueryVariables>;
export const TaskDocument = new TypedDocumentString(`
    query Task($id: ID!) {
  task(id: $id) {
    id
    agent {
      id
    }
    title
    message
    createdAt
    updatedAt
    completedAt
    imageUrl(width: 200)
    attachments {
      ... on FileAttachment {
        file {
          ...FileFields
        }
      }
      ... on LinkAttachment {
        url
        title
        description
      }
    }
    files {
      ...FileFields
    }
  }
}
    fragment FileFields on File {
  path
  name
  sizeBytes
  mimeType
  modifiedAt
  render {
    __typename
    ... on DocumentRender {
      markdown
      title
    }
    ... on CodeRender {
      content
      language
    }
    ... on ImageRender {
      url(width: 800)
      width
      height
      aspectRatio
    }
    ... on AudioRender {
      url
      durationSeconds
    }
    ... on VideoRender {
      url
      thumbnailUrl(width: 400)
      durationSeconds
    }
    ... on UnknownRender {
      mimeType
      sizeBytes
    }
  }
}`) as unknown as TypedDocumentString<TaskQuery, TaskQueryVariables>;
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
        files {
          ...FileFields
        }
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
    fragment FileFields on File {
  path
  name
  sizeBytes
  mimeType
  modifiedAt
  render {
    __typename
    ... on DocumentRender {
      markdown
      title
    }
    ... on CodeRender {
      content
      language
    }
    ... on ImageRender {
      url(width: 800)
      width
      height
      aspectRatio
    }
    ... on AudioRender {
      url
      durationSeconds
    }
    ... on VideoRender {
      url
      thumbnailUrl(width: 400)
      durationSeconds
    }
    ... on UnknownRender {
      mimeType
      sizeBytes
    }
  }
}`) as unknown as TypedDocumentString<TaskLogsQuery, TaskLogsQueryVariables>;
export const TaskLogCreatedDocument = new TypedDocumentString(`
    subscription TaskLogCreated($taskId: ID!) {
  taskLogCreated(taskId: $taskId) {
    id
    role
    content
    toolName
    toolInput
    toolResult
    files {
      ...FileFields
    }
    taskId
    createdAt
  }
}
    fragment FileFields on File {
  path
  name
  sizeBytes
  mimeType
  modifiedAt
  render {
    __typename
    ... on DocumentRender {
      markdown
      title
    }
    ... on CodeRender {
      content
      language
    }
    ... on ImageRender {
      url(width: 800)
      width
      height
      aspectRatio
    }
    ... on AudioRender {
      url
      durationSeconds
    }
    ... on VideoRender {
      url
      thumbnailUrl(width: 400)
      durationSeconds
    }
    ... on UnknownRender {
      mimeType
      sizeBytes
    }
  }
}`) as unknown as TypedDocumentString<TaskLogCreatedSubscription, TaskLogCreatedSubscriptionVariables>;
export const TaskUpdatedDocument = new TypedDocumentString(`
    subscription TaskUpdated($taskId: ID!) {
  taskUpdated(taskId: $taskId) {
    id
    title
    message
    updatedAt
    completedAt
    imageUrl(width: 200)
    attachments {
      ... on FileAttachment {
        file {
          ...FileFields
        }
      }
      ... on LinkAttachment {
        url
        title
        description
      }
    }
    files {
      ...FileFields
    }
  }
}
    fragment FileFields on File {
  path
  name
  sizeBytes
  mimeType
  modifiedAt
  render {
    __typename
    ... on DocumentRender {
      markdown
      title
    }
    ... on CodeRender {
      content
      language
    }
    ... on ImageRender {
      url(width: 800)
      width
      height
      aspectRatio
    }
    ... on AudioRender {
      url
      durationSeconds
    }
    ... on VideoRender {
      url
      thumbnailUrl(width: 400)
      durationSeconds
    }
    ... on UnknownRender {
      mimeType
      sizeBytes
    }
  }
}`) as unknown as TypedDocumentString<TaskUpdatedSubscription, TaskUpdatedSubscriptionVariables>;
export const SandboxOutputDocument = new TypedDocumentString(`
    subscription SandboxOutput($taskId: ID!) {
  sandboxOutput(taskId: $taskId) {
    commandId
    stream
    data
    done
    exitCode
  }
}
    `) as unknown as TypedDocumentString<SandboxOutputSubscription, SandboxOutputSubscriptionVariables>;
export const WorkspaceEntriesDocument = new TypedDocumentString(`
    query WorkspaceEntries($path: String!) {
  workspaceEntries(path: $path) {
    name
    path
    isDirectory
    size
    modifiedAt
  }
}
    `) as unknown as TypedDocumentString<WorkspaceEntriesQuery, WorkspaceEntriesQueryVariables>;
export const WorkspaceFileDocument = new TypedDocumentString(`
    query WorkspaceFile($path: String!) {
  workspaceFile(path: $path)
}
    `) as unknown as TypedDocumentString<WorkspaceFileQuery, WorkspaceFileQueryVariables>;
export const FileDocument = new TypedDocumentString(`
    query File($path: String!) {
  file(path: $path) {
    path
    name
    sizeBytes
    mimeType
    modifiedAt
    render {
      __typename
      ... on DocumentRender {
        markdown
        title
      }
      ... on CodeRender {
        content
        language
      }
      ... on ImageRender {
        url(width: 800)
        width
        height
        aspectRatio
      }
      ... on AudioRender {
        url
        durationSeconds
      }
      ... on VideoRender {
        url
        thumbnailUrl(width: 400)
        durationSeconds
      }
      ... on UnknownRender {
        mimeType
        sizeBytes
      }
    }
  }
}
    `) as unknown as TypedDocumentString<FileQuery, FileQueryVariables>;