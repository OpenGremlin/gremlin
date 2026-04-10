/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  delegationHint?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  imageUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  personality?: Maybe<Scalars['String']['output']>;
  portraitId: Scalars['String']['output'];
  retired: Scalars['Boolean']['output'];
  role?: Maybe<Scalars['String']['output']>;
  ttsVoice?: Maybe<Scalars['String']['output']>;
  voiceEnabled: Scalars['Boolean']['output'];
};


export type AgentImageUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type AgentConfig = {
  __typename?: 'AgentConfig';
  imageGeneration?: Maybe<AgentImageGenerationConfig>;
  imageModel?: Maybe<AgentModelConfig>;
  manager?: Maybe<AgentManagerConfig>;
  model?: Maybe<AgentModelConfig>;
  reasoning?: Maybe<AgentReasoningConfig>;
  sandbox?: Maybe<AgentSandboxConfig>;
  speech?: Maybe<AgentSpeechConfig>;
  speechModel?: Maybe<AgentModelConfig>;
  viewImage?: Maybe<AgentViewImageConfig>;
  webSearch?: Maybe<AgentWebSearchConfig>;
};

export type AgentConfigInput = {
  imageGeneration?: InputMaybe<AgentImageGenerationConfigInput>;
  imageModel?: InputMaybe<AgentModelConfigInput>;
  manager?: InputMaybe<AgentManagerConfigInput>;
  model?: InputMaybe<AgentModelConfigInput>;
  reasoning?: InputMaybe<AgentReasoningConfigInput>;
  sandbox?: InputMaybe<AgentSandboxConfigInput>;
  speech?: InputMaybe<AgentSpeechConfigInput>;
  speechModel?: InputMaybe<AgentModelConfigInput>;
  viewImage?: InputMaybe<AgentViewImageConfigInput>;
  webSearch?: InputMaybe<AgentWebSearchConfigInput>;
};

export type AgentImageGenerationConfig = {
  __typename?: 'AgentImageGenerationConfig';
  enabled: Scalars['Boolean']['output'];
};

export type AgentImageGenerationConfigInput = {
  enabled: Scalars['Boolean']['input'];
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
  displayHint?: Maybe<Scalars['String']['output']>;
  displayVariant?: Maybe<Scalars['String']['output']>;
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

export type AgentManagerConfig = {
  __typename?: 'AgentManagerConfig';
  enabled: Scalars['Boolean']['output'];
  team: Array<Scalars['String']['output']>;
};

export type AgentManagerConfigInput = {
  enabled: Scalars['Boolean']['input'];
  team: Array<Scalars['String']['input']>;
};

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

export type AgentReasoningConfig = {
  __typename?: 'AgentReasoningConfig';
  enabled: Scalars['Boolean']['output'];
};

export type AgentReasoningConfigInput = {
  enabled: Scalars['Boolean']['input'];
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

export type AgentSpeechConfig = {
  __typename?: 'AgentSpeechConfig';
  enabled: Scalars['Boolean']['output'];
  voice?: Maybe<Scalars['String']['output']>;
};

export type AgentSpeechConfigInput = {
  enabled: Scalars['Boolean']['input'];
  voice?: InputMaybe<Scalars['String']['input']>;
};

export type AgentStreamDelta = {
  __typename?: 'AgentStreamDelta';
  agentId: Scalars['ID']['output'];
  delta: Scalars['String']['output'];
  done: Scalars['Boolean']['output'];
  /** text (default) or reasoning */
  kind?: Maybe<Scalars['String']['output']>;
  logId: Scalars['ID']['output'];
  taskId?: Maybe<Scalars['String']['output']>;
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

export type AwsIamRoleConnectionMeta = {
  __typename?: 'AwsIamRoleConnectionMeta';
  accountId?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  roleArn: Scalars['String']['output'];
};

export type AwsPresetRole = {
  __typename?: 'AwsPresetRole';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  roleArn: Scalars['String']['output'];
};

export type AwsSetupInfo = {
  __typename?: 'AwsSetupInfo';
  trustPolicy: Scalars['String']['output'];
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

export type ConnectionMeta = ApiKeyConnectionMeta | AwsIamRoleConnectionMeta | OAuthConnectionMeta;

export type CreateAgentInput = {
  delegationHint?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  personality?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
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
  modelName?: Maybe<Scalars['String']['output']>;
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
  modelMode: Scalars['String']['output'];
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
  android?: Maybe<OAuthPlatformOverride>;
  authorizeUrl?: Maybe<Scalars['String']['output']>;
  availableScopes: Array<AvailableScope>;
  category: Scalars['String']['output'];
  connectionCount: Scalars['Int']['output'];
  connectionType: Scalars['String']['output'];
  defaultClientId?: Maybe<Scalars['String']['output']>;
  defaultScopes?: Maybe<Array<Scalars['String']['output']>>;
  description: Scalars['String']['output'];
  extraAuthParams?: Maybe<Scalars['String']['output']>;
  hasConnection: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  ios?: Maybe<OAuthPlatformOverride>;
  models?: Maybe<Array<ModelInfo>>;
  scopePrefix?: Maybe<Scalars['String']['output']>;
  service: Scalars['String']['output'];
  tokenUrl?: Maybe<Scalars['String']['output']>;
  userInfo?: Maybe<Scalars['String']['output']>;
};

export type LinkAttachment = {
  __typename?: 'LinkAttachment';
  description?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export type ModelInfo = {
  __typename?: 'ModelInfo';
  id: Scalars['ID']['output'];
  inputCostPerImage?: Maybe<Scalars['Float']['output']>;
  inputCostPerImageToken?: Maybe<Scalars['Float']['output']>;
  inputCostPerToken?: Maybe<Scalars['Float']['output']>;
  maxInputTokens?: Maybe<Scalars['Int']['output']>;
  mode: Scalars['String']['output'];
  name: Scalars['String']['output'];
  outputCostPerImage?: Maybe<Scalars['Float']['output']>;
  outputCostPerImageToken?: Maybe<Scalars['Float']['output']>;
  outputCostPerToken?: Maybe<Scalars['Float']['output']>;
  supportedModalities?: Maybe<Array<Scalars['String']['output']>>;
  supportedOutputModalities?: Maybe<Array<Scalars['String']['output']>>;
  supportsReasoning?: Maybe<Scalars['Boolean']['output']>;
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
  connectAwsIamRole: IntegrationConnection;
  createAgent: Agent;
  createAgentJob: AgentJob;
  deleteAgentJob?: Maybe<AgentJob>;
  disableBedrockModel: Array<Scalars['String']['output']>;
  disableModel: Array<EnabledModelEntry>;
  dismissUserInputRequest?: Maybe<UserInputRequest>;
  enableBedrockModel: Array<Scalars['String']['output']>;
  enableModel: Array<EnabledModelEntry>;
  removeCommandAllowlistEntry: Array<AllowlistEntry>;
  /** Remove a skill from an agent */
  removeSkill: AgentSkill;
  requestFileUploads: Array<FileUploadUrl>;
  resolveCommandApproval?: Maybe<CommandApproval>;
  resolveUserInputRequest?: Maybe<UserInputRequest>;
  retireAgent: Agent;
  revokeIntegrationConnection: IntegrationConnection;
  sendMessage: SendMessageResult;
  setDefaultImageModel: DefaultModel;
  setDefaultModel: DefaultModel;
  setDefaultSpeechModel: DefaultModel;
  submitOAuthConnection: IntegrationConnection;
  triggerJob: AgentJob;
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


export type MutationConnectAwsIamRoleArgs = {
  displayName?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
  roleArn: Scalars['String']['input'];
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
  modelName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEnableModelArgs = {
  modelId: Scalars['String']['input'];
  modelName?: InputMaybe<Scalars['String']['input']>;
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


export type MutationSetDefaultImageModelArgs = {
  modelId: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
};


export type MutationSetDefaultModelArgs = {
  modelId: Scalars['String']['input'];
  providerId: Scalars['String']['input'];
};


export type MutationSetDefaultSpeechModelArgs = {
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

export type OAuthPlatformOverride = {
  __typename?: 'OAuthPlatformOverride';
  clientId: Scalars['String']['output'];
  redirectUri: Scalars['String']['output'];
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
  mode: Scalars['String']['output'];
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
  awsPresetRoles: Array<AwsPresetRole>;
  awsSetupInfo: AwsSetupInfo;
  bedrockAvailableModels: Array<ModelInfo>;
  bedrockEnabledModels: Array<Scalars['String']['output']>;
  commandAllowlist: Array<AllowlistEntry>;
  defaultImageModel?: Maybe<DefaultModel>;
  defaultModel?: Maybe<DefaultModel>;
  defaultSpeechModel?: Maybe<DefaultModel>;
  /** Build TTS audio URLs for arbitrary text using an agent's voice config */
  documentSpeechUrls: Array<Scalars['String']['output']>;
  enabledModelDetails: Array<ModelInfo>;
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
  /** Build TTS audio URLs for a completed agent log message, one per sentence */
  speechUrls: Array<Scalars['String']['output']>;
  speechVoices: Array<SpeechVoice>;
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


export type QueryDocumentSpeechUrlsArgs = {
  agentId: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};


export type QueryEnabledModelDetailsArgs = {
  providerId: Scalars['String']['input'];
};


export type QueryEnabledModelsArgs = {
  providerId: Scalars['String']['input'];
};


export type QueryFileArgs = {
  path: Scalars['String']['input'];
};


export type QueryIntegrationConnectionsArgs = {
  excludeCategory?: InputMaybe<Scalars['String']['input']>;
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


export type QuerySpeechUrlsArgs = {
  logId: Scalars['ID']['input'];
};


export type QuerySpeechVoicesArgs = {
  connectionId: Scalars['String']['input'];
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
  /** Markdown body of SKILL.md (without YAML frontmatter) */
  instructions?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  tags?: Maybe<Array<Scalars['String']['output']>>;
  version: Scalars['String']['output'];
};

export type SpeechAudioChunk = {
  __typename?: 'SpeechAudioChunk';
  agentId: Scalars['ID']['output'];
  done: Scalars['Boolean']['output'];
  logId: Scalars['ID']['output'];
  sentenceIndex: Scalars['Int']['output'];
  url: Scalars['String']['output'];
};

export type SpeechVoice = {
  __typename?: 'SpeechVoice';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  previewUrl?: Maybe<Scalars['String']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  _empty?: Maybe<Scalars['String']['output']>;
  agentLogCreated: AgentLog;
  agentStream: AgentStreamDelta;
  agentUpdated: Agent;
  agentsUpdated: Agent;
  jobCreated: AgentJob;
  jobTaskCreated: Task;
  /** Subscribe to log entries by agentId or taskId */
  logCreated: AgentLog;
  pendingItemsUpdated: Scalars['Boolean']['output'];
  sandboxOutput: SandboxOutput;
  /** Subscribe to sentence-level TTS audio URLs by agentId or taskId */
  speechStream: SpeechAudioChunk;
  taskLogCreated: AgentLog;
  taskUpdated: Task;
  tasksUpdated: Task;
};


export type SubscriptionAgentLogCreatedArgs = {
  agentId: Scalars['ID']['input'];
};


export type SubscriptionAgentStreamArgs = {
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


export type SubscriptionLogCreatedArgs = {
  agentId?: InputMaybe<Scalars['ID']['input']>;
  taskId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionSandboxOutputArgs = {
  taskId: Scalars['ID']['input'];
};


export type SubscriptionSpeechStreamArgs = {
  agentId?: InputMaybe<Scalars['ID']['input']>;
  taskId?: InputMaybe<Scalars['ID']['input']>;
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
  emoji?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use attachments instead */
  files: Array<File>;
  id: Scalars['ID']['output'];
  logs: AgentLogConnection;
  message?: Maybe<Scalars['String']['output']>;
  originJobId?: Maybe<Scalars['String']['output']>;
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
  BackgroundTask = 'backgroundTask',
  Delegate = 'delegate',
  EditFile = 'editFile',
  EnsureSandbox = 'ensureSandbox',
  GenerateImage = 'generateImage',
  GenerateSpeech = 'generateSpeech',
  Glob = 'glob',
  Grep = 'grep',
  ListFiles = 'listFiles',
  ListJobs = 'listJobs',
  ReadCommandOutput = 'readCommandOutput',
  ReadFile = 'readFile',
  ReadSkill = 'readSkill',
  ReadSkillReference = 'readSkillReference',
  RecallMemory = 'recallMemory',
  ReplyToAssigner = 'replyToAssigner',
  RequestUserInput = 'requestUserInput',
  RunCommand = 'runCommand',
  SaveMemory = 'saveMemory',
  ScheduleJob = 'scheduleJob',
  UpdateJob = 'updateJob',
  UpdateTaskMessage = 'updateTaskMessage',
  ViewImage = 'viewImage',
  WebFetch = 'webFetch',
  WebSearch = 'webSearch',
  WriteFile = 'writeFile'
}

export type UnknownRender = {
  __typename?: 'UnknownRender';
  mimeType?: Maybe<Scalars['String']['output']>;
  sizeBytes: Scalars['Int']['output'];
};

export type UpdateAgentInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  config?: InputMaybe<AgentConfigInput>;
  delegationHint?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  personality?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
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

export type AgentLogsQueryVariables = Exact<{
  agentId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type AgentLogsQuery = { __typename?: 'Query', agentLogs: { __typename?: 'AgentLogConnection', edges: Array<{ __typename?: 'AgentLogEdge', cursor: string, node: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, displayHint?: string | null, displayVariant?: string | null, commandApprovalId?: string | null, taskId?: string | null, createdAt: string, attachments: Array<
          | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
                | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
                | { __typename: 'CodeRender', content: string, language: string }
                | { __typename: 'DocumentRender', markdown: string, title?: string | null }
                | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
                | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
                | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
               } }
          | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
        >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
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

export type PendingInboxMessagesQueryVariables = Exact<{
  agentId: Scalars['ID']['input'];
  taskId?: InputMaybe<Scalars['String']['input']>;
}>;


export type PendingInboxMessagesQuery = { __typename?: 'Query', pendingInboxMessages: Array<{ __typename?: 'PendingInboxMessage', id: string, content: string, createdAt: string }> };

export type AgentLogCreatedSubscriptionVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentLogCreatedSubscription = { __typename?: 'Subscription', agentLogCreated: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, displayHint?: string | null, displayVariant?: string | null, commandApprovalId?: string | null, taskId?: string | null, createdAt: string, attachments: Array<
      | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           } }
      | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
    >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
        | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
        | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
       }> } };

export type LogCreatedSubscriptionVariables = Exact<{
  agentId?: InputMaybe<Scalars['ID']['input']>;
  taskId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type LogCreatedSubscription = { __typename?: 'Subscription', logCreated: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, displayHint?: string | null, displayVariant?: string | null, commandApprovalId?: string | null, taskId?: string | null, createdAt: string, attachments: Array<
      | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           } }
      | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
    >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
        | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
        | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
       }> } };

export type AgentStreamSubscriptionVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentStreamSubscription = { __typename?: 'Subscription', agentStream: { __typename?: 'AgentStreamDelta', logId: string, agentId: string, taskId?: string | null, delta: string, done: boolean, kind?: string | null } };

export type SpeechUrlsQueryVariables = Exact<{
  logId: Scalars['ID']['input'];
}>;


export type SpeechUrlsQuery = { __typename?: 'Query', speechUrls: Array<string> };

export type DocumentSpeechUrlsQueryVariables = Exact<{
  text: Scalars['String']['input'];
  agentId: Scalars['ID']['input'];
}>;


export type DocumentSpeechUrlsQuery = { __typename?: 'Query', documentSpeechUrls: Array<string> };

export type SpeechStreamSubscriptionVariables = Exact<{
  agentId?: InputMaybe<Scalars['ID']['input']>;
  taskId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SpeechStreamSubscription = { __typename?: 'Subscription', speechStream: { __typename?: 'SpeechAudioChunk', logId: string, agentId: string, sentenceIndex: number, url: string, done: boolean } };

export type AgentsQueryVariables = Exact<{ [key: string]: never; }>;


export type AgentsQuery = { __typename?: 'Query', agents: Array<{ __typename?: 'Agent', id: string, name: string, role?: string | null, delegationHint?: string | null, retired: boolean, voiceEnabled: boolean }> };

export type AgentQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AgentQuery = { __typename?: 'Query', agent?: { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, personality?: string | null, role?: string | null, delegationHint?: string | null, retired: boolean, ttsVoice?: string | null, config?: { __typename?: 'AgentConfig', model?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, imageModel?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, speechModel?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, sandbox?: { __typename?: 'AgentSandboxConfig', enabled: boolean, idleTimeoutMinutes?: number | null, alwaysOn?: boolean | null, commandApproval: string } | null, webSearch?: { __typename?: 'AgentWebSearchConfig', enabled: boolean, provider?: string | null } | null, reasoning?: { __typename?: 'AgentReasoningConfig', enabled: boolean } | null, viewImage?: { __typename?: 'AgentViewImageConfig', enabled: boolean } | null, imageGeneration?: { __typename?: 'AgentImageGenerationConfig', enabled: boolean } | null, speech?: { __typename?: 'AgentSpeechConfig', enabled: boolean, voice?: string | null } | null, manager?: { __typename?: 'AgentManagerConfig', enabled: boolean, team: Array<string> } | null } | null } | null };

export type UpdateAgentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAgentInput;
}>;


export type UpdateAgentMutation = { __typename?: 'Mutation', updateAgent?: { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, personality?: string | null, role?: string | null, delegationHint?: string | null, retired: boolean, ttsVoice?: string | null, config?: { __typename?: 'AgentConfig', model?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, imageModel?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, speechModel?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, sandbox?: { __typename?: 'AgentSandboxConfig', enabled: boolean, idleTimeoutMinutes?: number | null, alwaysOn?: boolean | null, commandApproval: string } | null, webSearch?: { __typename?: 'AgentWebSearchConfig', enabled: boolean, provider?: string | null } | null, reasoning?: { __typename?: 'AgentReasoningConfig', enabled: boolean } | null, viewImage?: { __typename?: 'AgentViewImageConfig', enabled: boolean } | null, imageGeneration?: { __typename?: 'AgentImageGenerationConfig', enabled: boolean } | null, speech?: { __typename?: 'AgentSpeechConfig', enabled: boolean, voice?: string | null } | null, manager?: { __typename?: 'AgentManagerConfig', enabled: boolean, team: Array<string> } | null } | null } | null };

export type CreateAgentMutationVariables = Exact<{
  input: CreateAgentInput;
}>;


export type CreateAgentMutation = { __typename?: 'Mutation', createAgent: { __typename?: 'Agent', id: string, name: string, role?: string | null, delegationHint?: string | null, retired: boolean, voiceEnabled: boolean } };

export type RetireAgentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RetireAgentMutation = { __typename?: 'Mutation', retireAgent: { __typename?: 'Agent', id: string, name: string, role?: string | null, delegationHint?: string | null, retired: boolean, voiceEnabled: boolean } };

export type UnretireAgentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnretireAgentMutation = { __typename?: 'Mutation', unretireAgent: { __typename?: 'Agent', id: string, name: string, role?: string | null, delegationHint?: string | null, retired: boolean, voiceEnabled: boolean } };

export type AgentUpdatedSubscriptionVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentUpdatedSubscription = { __typename?: 'Subscription', agentUpdated: { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, personality?: string | null, role?: string | null, delegationHint?: string | null, retired: boolean, ttsVoice?: string | null, config?: { __typename?: 'AgentConfig', model?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, imageModel?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, speechModel?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, sandbox?: { __typename?: 'AgentSandboxConfig', enabled: boolean, idleTimeoutMinutes?: number | null, alwaysOn?: boolean | null, commandApproval: string } | null, webSearch?: { __typename?: 'AgentWebSearchConfig', enabled: boolean, provider?: string | null } | null, reasoning?: { __typename?: 'AgentReasoningConfig', enabled: boolean } | null, viewImage?: { __typename?: 'AgentViewImageConfig', enabled: boolean } | null, imageGeneration?: { __typename?: 'AgentImageGenerationConfig', enabled: boolean } | null, speech?: { __typename?: 'AgentSpeechConfig', enabled: boolean, voice?: string | null } | null, manager?: { __typename?: 'AgentManagerConfig', enabled: boolean, team: Array<string> } | null } | null } };

export type CommandAllowlistQueryVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type CommandAllowlistQuery = { __typename?: 'Query', commandAllowlist: Array<{ __typename?: 'AllowlistEntry', pattern: string }> };

export type AddCommandAllowlistEntryMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  pattern: Scalars['String']['input'];
}>;


export type AddCommandAllowlistEntryMutation = { __typename?: 'Mutation', addCommandAllowlistEntry: Array<{ __typename?: 'AllowlistEntry', pattern: string }> };

export type RemoveCommandAllowlistEntryMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  pattern: Scalars['String']['input'];
}>;


export type RemoveCommandAllowlistEntryMutation = { __typename?: 'Mutation', removeCommandAllowlistEntry: Array<{ __typename?: 'AllowlistEntry', pattern: string }> };

export type PendingCommandApprovalsQueryVariables = Exact<{ [key: string]: never; }>;


export type PendingCommandApprovalsQuery = { __typename?: 'Query', pendingCommandApprovals: Array<{ __typename?: 'CommandApproval', id: string, taskId: string, command: string, reason: string, status: CommandApprovalStatus, decision?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string } }> };

export type ResolveCommandApprovalMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  decision: CommandApprovalDecision;
}>;


export type ResolveCommandApprovalMutation = { __typename?: 'Mutation', resolveCommandApproval?: { __typename?: 'CommandApproval', id: string, taskId: string, command: string, reason: string, status: CommandApprovalStatus, decision?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string } } | null };

export type FileFieldsFragment = { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
    | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
    | { __typename: 'CodeRender', content: string, language: string }
    | { __typename: 'DocumentRender', markdown: string, title?: string | null }
    | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
    | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
    | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
   };

type AttachmentFields_FileAttachment_Fragment = { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
      | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
      | { __typename: 'CodeRender', content: string, language: string }
      | { __typename: 'DocumentRender', markdown: string, title?: string | null }
      | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
      | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
      | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
     } };

type AttachmentFields_LinkAttachment_Fragment = { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null };

export type AttachmentFieldsFragment =
  | AttachmentFields_FileAttachment_Fragment
  | AttachmentFields_LinkAttachment_Fragment
;

export type AgentSummaryFragment = { __typename?: 'Agent', id: string, name: string, role?: string | null, delegationHint?: string | null, retired: boolean, voiceEnabled: boolean };

export type AgentDetailFragment = { __typename?: 'Agent', id: string, name: string, avatar: string, portraitId: string, imageUrl: string, personality?: string | null, role?: string | null, delegationHint?: string | null, retired: boolean, ttsVoice?: string | null, config?: { __typename?: 'AgentConfig', model?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, imageModel?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, speechModel?: { __typename?: 'AgentModelConfig', type: string, modelId?: string | null, connectionId?: string | null } | null, sandbox?: { __typename?: 'AgentSandboxConfig', enabled: boolean, idleTimeoutMinutes?: number | null, alwaysOn?: boolean | null, commandApproval: string } | null, webSearch?: { __typename?: 'AgentWebSearchConfig', enabled: boolean, provider?: string | null } | null, reasoning?: { __typename?: 'AgentReasoningConfig', enabled: boolean } | null, viewImage?: { __typename?: 'AgentViewImageConfig', enabled: boolean } | null, imageGeneration?: { __typename?: 'AgentImageGenerationConfig', enabled: boolean } | null, speech?: { __typename?: 'AgentSpeechConfig', enabled: boolean, voice?: string | null } | null, manager?: { __typename?: 'AgentManagerConfig', enabled: boolean, team: Array<string> } | null } | null };

export type AgentLogFieldsFragment = { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, displayHint?: string | null, displayVariant?: string | null, commandApprovalId?: string | null, taskId?: string | null, createdAt: string, attachments: Array<
    | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
          | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
          | { __typename: 'CodeRender', content: string, language: string }
          | { __typename: 'DocumentRender', markdown: string, title?: string | null }
          | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
          | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
          | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
         } }
    | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
  >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
      | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
      | { __typename: 'CodeRender', content: string, language: string }
      | { __typename: 'DocumentRender', markdown: string, title?: string | null }
      | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
      | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
      | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
     }> };

export type TaskSummaryFragment = { __typename?: 'Task', id: string, title: string, message?: string | null, createdAt: string, emoji?: string | null, agent: { __typename?: 'Agent', id: string, name: string, role?: string | null, delegationHint?: string | null, retired: boolean, voiceEnabled: boolean }, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
      | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
      | { __typename: 'CodeRender', content: string, language: string }
      | { __typename: 'DocumentRender', markdown: string, title?: string | null }
      | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
      | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
      | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
     }> };

export type TaskDetailFragment = { __typename?: 'Task', id: string, title: string, message?: string | null, createdAt: string, updatedAt: string, completedAt?: string | null, emoji?: string | null, agent: { __typename?: 'Agent', id: string }, attachments: Array<
    | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
          | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
          | { __typename: 'CodeRender', content: string, language: string }
          | { __typename: 'DocumentRender', markdown: string, title?: string | null }
          | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
          | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
          | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
         } }
    | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
  >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
      | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
      | { __typename: 'CodeRender', content: string, language: string }
      | { __typename: 'DocumentRender', markdown: string, title?: string | null }
      | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
      | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
      | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
     }> };

export type AgentJobSummaryFragment = { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean } };

export type AgentJobDetailFragment = { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean }, tasks: Array<{ __typename?: 'Task', id: string, title: string, createdAt: string, agent: { __typename?: 'Agent', id: string } }> };

export type CommandApprovalFieldsFragment = { __typename?: 'CommandApproval', id: string, taskId: string, command: string, reason: string, status: CommandApprovalStatus, decision?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string } };

export type UserInputRequestFieldsFragment = { __typename?: 'UserInputRequest', id: string, turnId?: string | null, message: string, status: UserInputRequestStatus, resolvedAction?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string }, actions: Array<{ __typename?: 'UserInputRequestAction', label: string, style: string }> };

export type SkillTemplateFieldsFragment = { __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> };

export type AgentSkillFieldsFragment = { __typename?: 'AgentSkill', skillId: string, agentId: string, assignedAt: string, template?: { __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> } | null, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, boundConnectionIds: Array<string>, connected: boolean }> };

export type IntegrationConnectionFieldsFragment = { __typename?: 'IntegrationConnection', id: string, providerId: string, connectionType: string, connectedAt: string, isRevoked: boolean, provider: { __typename?: 'IntegrationProvider', id: string, service: string, description: string }, meta:
    | { __typename: 'ApiKeyConnectionMeta', accountId?: string | null }
    | { __typename: 'AwsIamRoleConnectionMeta', accountId?: string | null, roleArn: string, region?: string | null, displayName?: string | null }
    | { __typename: 'OAuthConnectionMeta', accountId?: string | null, scopes: Array<string>, expiresAt?: string | null }
   };

export type IntegrationProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationProvidersQuery = { __typename?: 'Query', integrationProviders: Array<{ __typename?: 'IntegrationProvider', id: string, service: string, category: string, description: string, connectionType: string, authorizeUrl?: string | null, tokenUrl?: string | null, defaultClientId?: string | null, defaultScopes?: Array<string> | null, scopePrefix?: string | null, extraAuthParams?: string | null, userInfo?: string | null, connectionCount: number, hasConnection: boolean, ios?: { __typename?: 'OAuthPlatformOverride', clientId: string, redirectUri: string } | null, android?: { __typename?: 'OAuthPlatformOverride', clientId: string, redirectUri: string } | null, availableScopes: Array<{ __typename?: 'AvailableScope', scope: string, label: string }>, models?: Array<{ __typename?: 'ModelInfo', id: string, name: string, mode: string }> | null }>, defaultModel?: { __typename?: 'DefaultModel', providerId: string, modelId: string, modelName?: string | null } | null, defaultImageModel?: { __typename?: 'DefaultModel', providerId: string, modelId: string, modelName?: string | null } | null, defaultSpeechModel?: { __typename?: 'DefaultModel', providerId: string, modelId: string, modelName?: string | null } | null };

export type IntegrationConnectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationConnectionsQuery = { __typename?: 'Query', integrationConnections: Array<{ __typename?: 'IntegrationConnection', id: string, providerId: string, connectionType: string, connectedAt: string, isRevoked: boolean, provider: { __typename?: 'IntegrationProvider', id: string, service: string, description: string }, meta:
      | { __typename: 'ApiKeyConnectionMeta', accountId?: string | null }
      | { __typename: 'AwsIamRoleConnectionMeta', accountId?: string | null, roleArn: string, region?: string | null, displayName?: string | null }
      | { __typename: 'OAuthConnectionMeta', accountId?: string | null, scopes: Array<string>, expiresAt?: string | null }
     }> };

export type AwsSetupQueryVariables = Exact<{ [key: string]: never; }>;


export type AwsSetupQuery = { __typename?: 'Query', awsPresetRoles: Array<{ __typename?: 'AwsPresetRole', id: string, name: string, description: string, roleArn: string }>, awsSetupInfo: { __typename?: 'AwsSetupInfo', trustPolicy: string } };

export type ConnectAwsIamRoleMutationVariables = Exact<{
  roleArn: Scalars['String']['input'];
  displayName?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
}>;


export type ConnectAwsIamRoleMutation = { __typename?: 'Mutation', connectAwsIamRole: { __typename?: 'IntegrationConnection', id: string, providerId: string, connectionType: string, connectedAt: string, isRevoked: boolean, provider: { __typename?: 'IntegrationProvider', id: string, service: string, description: string }, meta:
      | { __typename: 'ApiKeyConnectionMeta', accountId?: string | null }
      | { __typename: 'AwsIamRoleConnectionMeta', accountId?: string | null, roleArn: string, region?: string | null, displayName?: string | null }
      | { __typename: 'OAuthConnectionMeta', accountId?: string | null, scopes: Array<string>, expiresAt?: string | null }
     } };

export type ConnectApiKeyMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  apiKey: Scalars['String']['input'];
}>;


export type ConnectApiKeyMutation = { __typename?: 'Mutation', connectApiKey: { __typename?: 'ConnectApiKeyResult', connectionId: string, models: Array<{ __typename?: 'ProviderModelInfo', id: string, name: string, mode: string }> } };

export type ProviderModelsQueryVariables = Exact<{
  providerId: Scalars['String']['input'];
}>;


export type ProviderModelsQuery = { __typename?: 'Query', providerModels: Array<{ __typename?: 'ProviderModelInfo', id: string, name: string, mode: string }> };

export type RevokeConnectionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RevokeConnectionMutation = { __typename?: 'Mutation', revokeIntegrationConnection: { __typename?: 'IntegrationConnection', id: string, providerId: string, connectionType: string, connectedAt: string, isRevoked: boolean, provider: { __typename?: 'IntegrationProvider', id: string, service: string, description: string }, meta:
      | { __typename: 'ApiKeyConnectionMeta', accountId?: string | null }
      | { __typename: 'AwsIamRoleConnectionMeta', accountId?: string | null, roleArn: string, region?: string | null, displayName?: string | null }
      | { __typename: 'OAuthConnectionMeta', accountId?: string | null, scopes: Array<string>, expiresAt?: string | null }
     } };

export type SetDefaultModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type SetDefaultModelMutation = { __typename?: 'Mutation', setDefaultModel: { __typename?: 'DefaultModel', providerId: string, modelId: string, modelName?: string | null } };

export type SetDefaultImageModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type SetDefaultImageModelMutation = { __typename?: 'Mutation', setDefaultImageModel: { __typename?: 'DefaultModel', providerId: string, modelId: string, modelName?: string | null } };

export type SetDefaultSpeechModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type SetDefaultSpeechModelMutation = { __typename?: 'Mutation', setDefaultSpeechModel: { __typename?: 'DefaultModel', providerId: string, modelId: string, modelName?: string | null } };

export type SpeechVoicesQueryVariables = Exact<{
  connectionId: Scalars['String']['input'];
}>;


export type SpeechVoicesQuery = { __typename?: 'Query', speechVoices: Array<{ __typename?: 'SpeechVoice', id: string, name: string, description?: string | null, previewUrl?: string | null }> };

export type EnabledModelsQueryVariables = Exact<{
  providerId: Scalars['String']['input'];
}>;


export type EnabledModelsQuery = { __typename?: 'Query', enabledModels: Array<string> };

export type AllEnabledModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type AllEnabledModelsQuery = { __typename?: 'Query', allEnabledModels: Array<{ __typename?: 'EnabledModelEntry', providerId: string, modelId: string, modelName?: string | null, modelMode: string }> };

export type EnableModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
  modelName?: InputMaybe<Scalars['String']['input']>;
}>;


export type EnableModelMutation = { __typename?: 'Mutation', enableModel: Array<{ __typename?: 'EnabledModelEntry', providerId: string, modelId: string, modelName?: string | null, modelMode: string }> };

export type DisableModelMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  modelId: Scalars['String']['input'];
}>;


export type DisableModelMutation = { __typename?: 'Mutation', disableModel: Array<{ __typename?: 'EnabledModelEntry', providerId: string, modelId: string, modelName?: string | null, modelMode: string }> };

export type BedrockEnabledModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type BedrockEnabledModelsQuery = { __typename?: 'Query', bedrockEnabledModels: Array<string> };

export type EnabledModelDetailsQueryVariables = Exact<{
  providerId: Scalars['String']['input'];
}>;


export type EnabledModelDetailsQuery = { __typename?: 'Query', enabledModelDetails: Array<{ __typename?: 'ModelInfo', id: string, name: string, mode: string, maxInputTokens?: number | null, inputCostPerToken?: number | null, outputCostPerToken?: number | null, supportedModalities?: Array<string> | null, supportedOutputModalities?: Array<string> | null, inputCostPerImage?: number | null, inputCostPerImageToken?: number | null, outputCostPerImage?: number | null, outputCostPerImageToken?: number | null, supportsReasoning?: boolean | null }> };

export type BedrockAvailableModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type BedrockAvailableModelsQuery = { __typename?: 'Query', bedrockAvailableModels: Array<{ __typename?: 'ModelInfo', id: string, name: string, mode: string }> };

export type EnableBedrockModelMutationVariables = Exact<{
  modelId: Scalars['String']['input'];
}>;


export type EnableBedrockModelMutation = { __typename?: 'Mutation', enableBedrockModel: Array<string> };

export type DisableBedrockModelMutationVariables = Exact<{
  modelId: Scalars['String']['input'];
}>;


export type DisableBedrockModelMutation = { __typename?: 'Mutation', disableBedrockModel: Array<string> };

export type SubmitOAuthConnectionMutationVariables = Exact<{
  providerId: Scalars['String']['input'];
  accessToken: Scalars['String']['input'];
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['String']['input']>;
  scopes: Array<Scalars['String']['input']> | Scalars['String']['input'];
  accountId?: InputMaybe<Scalars['String']['input']>;
  clientId?: InputMaybe<Scalars['String']['input']>;
}>;


export type SubmitOAuthConnectionMutation = { __typename?: 'Mutation', submitOAuthConnection: { __typename?: 'IntegrationConnection', id: string, providerId: string, connectionType: string, connectedAt: string, isRevoked: boolean, provider: { __typename?: 'IntegrationProvider', id: string, service: string, description: string }, meta:
      | { __typename: 'ApiKeyConnectionMeta', accountId?: string | null }
      | { __typename: 'AwsIamRoleConnectionMeta', accountId?: string | null, roleArn: string, region?: string | null, displayName?: string | null }
      | { __typename: 'OAuthConnectionMeta', accountId?: string | null, scopes: Array<string>, expiresAt?: string | null }
     } };

export type AgentJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type AgentJobsQuery = { __typename?: 'Query', agentJobs: Array<{ __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean } }> };

export type AgentJobQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AgentJobQuery = { __typename?: 'Query', agentJob?: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean }, tasks: Array<{ __typename?: 'Task', id: string, title: string, createdAt: string, agent: { __typename?: 'Agent', id: string } }> } | null };

export type DeleteAgentJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAgentJobMutation = { __typename?: 'Mutation', deleteAgentJob?: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean } } | null };

export type UpdateAgentJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAgentJobInput;
}>;


export type UpdateAgentJobMutation = { __typename?: 'Mutation', updateAgentJob?: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean } } | null };

export type JobTaskCreatedSubscriptionVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;


export type JobTaskCreatedSubscription = { __typename?: 'Subscription', jobTaskCreated: { __typename?: 'Task', id: string, title: string, createdAt: string, agent: { __typename?: 'Agent', id: string } } };

export type TriggerJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TriggerJobMutation = { __typename?: 'Mutation', triggerJob: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean } } };

export type JobCreatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type JobCreatedSubscription = { __typename?: 'Subscription', jobCreated: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean } } };

export type CreateAgentJobMutationVariables = Exact<{
  input: CreateAgentJobInput;
}>;


export type CreateAgentJobMutation = { __typename?: 'Mutation', createAgentJob: { __typename?: 'AgentJob', id: string, name: string, description: string, recurrence: string, cronExpression?: string | null, timezone: string, paused: boolean, lastRun?: string | null, nextRun?: string | null, agent: { __typename?: 'Agent', id: string, name: string, retired: boolean } } };

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


export type SkillTemplateQuery = { __typename?: 'Query', skillTemplate?: { __typename?: 'SkillTemplate', instructions?: string | null, id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> } | null };

export type AgentSkillsQueryVariables = Exact<{
  agentId: Scalars['ID']['input'];
}>;


export type AgentSkillsQuery = { __typename?: 'Query', agentSkills: Array<{ __typename?: 'AgentSkill', skillId: string, agentId: string, assignedAt: string, template?: { __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> } | null, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, boundConnectionIds: Array<string>, connected: boolean }> }> };

export type AssignSkillMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
}>;


export type AssignSkillMutation = { __typename?: 'Mutation', assignSkill: { __typename?: 'AgentSkill', skillId: string, agentId: string, assignedAt: string, template?: { __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> } | null, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, boundConnectionIds: Array<string>, connected: boolean }> } };

export type RemoveSkillMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
}>;


export type RemoveSkillMutation = { __typename?: 'Mutation', removeSkill: { __typename?: 'AgentSkill', skillId: string, agentId: string, assignedAt: string, template?: { __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> } | null, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, boundConnectionIds: Array<string>, connected: boolean }> } };

export type BindAgentSkillConnectionMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
  provider: Scalars['String']['input'];
  connectionId: Scalars['ID']['input'];
}>;


export type BindAgentSkillConnectionMutation = { __typename?: 'Mutation', bindAgentSkillConnection: { __typename?: 'AgentSkill', skillId: string, agentId: string, assignedAt: string, template?: { __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> } | null, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, boundConnectionIds: Array<string>, connected: boolean }> } };

export type UnbindAgentSkillConnectionMutationVariables = Exact<{
  agentId: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
  provider: Scalars['String']['input'];
  connectionId: Scalars['ID']['input'];
}>;


export type UnbindAgentSkillConnectionMutation = { __typename?: 'Mutation', unbindAgentSkillConnection: { __typename?: 'AgentSkill', skillId: string, agentId: string, assignedAt: string, template?: { __typename?: 'SkillTemplate', id: string, name: string, displayName?: string | null, description: string, version: string, author?: string | null, category?: string | null, icon?: string | null, tags?: Array<string> | null, hasInstall: boolean, connections: Array<{ __typename?: 'SkillConnectionRequirement', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, requestedScopes?: Array<string> | null }> } | null, connectionStatuses: Array<{ __typename?: 'SkillConnectionStatus', provider: string, providerName: string, reason: string, optional: boolean, multi: boolean, boundConnectionIds: Array<string>, connected: boolean }> } };

export type TasksQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type TasksQuery = { __typename?: 'Query', tasks: { __typename?: 'TaskConnection', edges: Array<{ __typename?: 'TaskEdge', cursor: string, node: { __typename?: 'Task', id: string, title: string, message?: string | null, createdAt: string, emoji?: string | null, agent: { __typename?: 'Agent', id: string, name: string, role?: string | null, delegationHint?: string | null, retired: boolean, voiceEnabled: boolean }, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           }> } }>, pageInfo: { __typename?: 'TaskPageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type TaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TaskQuery = { __typename?: 'Query', task?: { __typename?: 'Task', id: string, title: string, message?: string | null, createdAt: string, updatedAt: string, completedAt?: string | null, emoji?: string | null, agent: { __typename?: 'Agent', id: string }, attachments: Array<
      | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           } }
      | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
    >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
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


export type TaskLogsQuery = { __typename?: 'Query', taskLogs: { __typename?: 'AgentLogConnection', edges: Array<{ __typename?: 'AgentLogEdge', cursor: string, node: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, displayHint?: string | null, displayVariant?: string | null, commandApprovalId?: string | null, taskId?: string | null, createdAt: string, attachments: Array<
          | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
                | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
                | { __typename: 'CodeRender', content: string, language: string }
                | { __typename: 'DocumentRender', markdown: string, title?: string | null }
                | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
                | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
                | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
               } }
          | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
        >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           }> } }>, pageInfo: { __typename?: 'AgentLogPageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type TaskLogCreatedSubscriptionVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type TaskLogCreatedSubscription = { __typename?: 'Subscription', taskLogCreated: { __typename?: 'AgentLog', id: string, role: AgentLogRole, content: string, toolName?: ToolName | null, toolInput?: string | null, toolResult?: string | null, displayHint?: string | null, displayVariant?: string | null, commandApprovalId?: string | null, taskId?: string | null, createdAt: string, attachments: Array<
      | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           } }
      | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
    >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
        | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
        | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
       }> } };

export type TaskUpdatedSubscriptionVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type TaskUpdatedSubscription = { __typename?: 'Subscription', taskUpdated: { __typename?: 'Task', id: string, title: string, message?: string | null, createdAt: string, updatedAt: string, completedAt?: string | null, emoji?: string | null, agent: { __typename?: 'Agent', id: string }, attachments: Array<
      | { __typename?: 'FileAttachment', file: { __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
            | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
            | { __typename: 'CodeRender', content: string, language: string }
            | { __typename: 'DocumentRender', markdown: string, title?: string | null }
            | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
            | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
            | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
           } }
      | { __typename?: 'LinkAttachment', url: string, title?: string | null, description?: string | null }
    >, files: Array<{ __typename?: 'File', path: string, name: string, sizeBytes: number, mimeType?: string | null, modifiedAt: string, render:
        | { __typename: 'AudioRender', url?: string | null, durationSeconds?: number | null }
        | { __typename: 'CodeRender', content: string, language: string }
        | { __typename: 'DocumentRender', markdown: string, title?: string | null }
        | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
        | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
        | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
       }> } };

export type SandboxOutputSubscriptionVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type SandboxOutputSubscription = { __typename?: 'Subscription', sandboxOutput: { __typename?: 'SandboxOutput', commandId: string, stream: string, data: string, done?: boolean | null, exitCode?: number | null } };

export type UserInputRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type UserInputRequestsQuery = { __typename?: 'Query', userInputRequests: Array<{ __typename?: 'UserInputRequest', id: string, turnId?: string | null, message: string, status: UserInputRequestStatus, resolvedAction?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string }, actions: Array<{ __typename?: 'UserInputRequestAction', label: string, style: string }> }> };

export type ResolveUserInputRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  action: Scalars['String']['input'];
}>;


export type ResolveUserInputRequestMutation = { __typename?: 'Mutation', resolveUserInputRequest?: { __typename?: 'UserInputRequest', id: string, turnId?: string | null, message: string, status: UserInputRequestStatus, resolvedAction?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string }, actions: Array<{ __typename?: 'UserInputRequestAction', label: string, style: string }> } | null };

export type DismissUserInputRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DismissUserInputRequestMutation = { __typename?: 'Mutation', dismissUserInputRequest?: { __typename?: 'UserInputRequest', id: string, turnId?: string | null, message: string, status: UserInputRequestStatus, resolvedAction?: string | null, createdAt: string, agent: { __typename?: 'Agent', id: string, name: string }, actions: Array<{ __typename?: 'UserInputRequestAction', label: string, style: string }> } | null };

export type PendingItemsUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PendingItemsUpdatedSubscription = { __typename?: 'Subscription', pendingItemsUpdated: boolean };

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
      | { __typename: 'ImageRender', url?: string | null, width?: number | null, height?: number | null, aspectRatio?: number | null, fullUrl?: string | null }
      | { __typename: 'UnknownRender', mimeType?: string | null, sizeBytes: number }
      | { __typename: 'VideoRender', url?: string | null, thumbnailUrl?: string | null, durationSeconds?: number | null }
     } | null };

export const AgentDetailFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"portraitId"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"200"}}]},{"kind":"Field","name":{"kind":"Name","value":"personality"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"ttsVoice"}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"imageModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"speechModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sandbox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"idleTimeoutMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"alwaysOn"}},{"kind":"Field","name":{"kind":"Name","value":"commandApproval"}}]}},{"kind":"Field","name":{"kind":"Name","value":"webSearch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reasoning"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"imageGeneration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"speech"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"voice"}}]}},{"kind":"Field","name":{"kind":"Name","value":"manager"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"team"}}]}}]}}]}}]} as unknown as DocumentNode<AgentDetailFragment, unknown>;
export const FileFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}}]} as unknown as DocumentNode<FileFieldsFragment, unknown>;
export const AttachmentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}}]} as unknown as DocumentNode<AttachmentFieldsFragment, unknown>;
export const AgentLogFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"toolName"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolResult"}},{"kind":"Field","name":{"kind":"Name","value":"displayHint"}},{"kind":"Field","name":{"kind":"Name","value":"displayVariant"}},{"kind":"Field","name":{"kind":"Name","value":"commandApprovalId"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<AgentLogFieldsFragment, unknown>;
export const AgentSummaryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"voiceEnabled"}}]}}]} as unknown as DocumentNode<AgentSummaryFragment, unknown>;
export const TaskSummaryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"emoji"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"voiceEnabled"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}}]} as unknown as DocumentNode<TaskSummaryFragment, unknown>;
export const TaskDetailFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"emoji"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<TaskDetailFragment, unknown>;
export const AgentJobSummaryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}}]}}]} as unknown as DocumentNode<AgentJobSummaryFragment, unknown>;
export const AgentJobDetailFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AgentJobDetailFragment, unknown>;
export const CommandApprovalFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommandApprovalFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CommandApproval"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"command"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"decision"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CommandApprovalFieldsFragment, unknown>;
export const UserInputRequestFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInputRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserInputRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"turnId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"style"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAction"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<UserInputRequestFieldsFragment, unknown>;
export const SkillTemplateFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}}]} as unknown as DocumentNode<SkillTemplateFieldsFragment, unknown>;
export const AgentSkillFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSkillFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentSkill"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skillId"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SkillTemplateFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionStatuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"boundConnectionIds"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}}]} as unknown as DocumentNode<AgentSkillFieldsFragment, unknown>;
export const IntegrationConnectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IntegrationConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionType"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRevoked"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKeyConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AwsIamRoleConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"roleArn"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}}]} as unknown as DocumentNode<IntegrationConnectionFieldsFragment, unknown>;
export const AgentLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AgentLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"last"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"before"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agentLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"last"},"value":{"kind":"Variable","name":{"kind":"Name","value":"last"}}},{"kind":"Argument","name":{"kind":"Name","value":"before"},"value":{"kind":"Variable","name":{"kind":"Name","value":"before"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentLogFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"toolName"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolResult"}},{"kind":"Field","name":{"kind":"Name","value":"displayHint"}},{"kind":"Field","name":{"kind":"Name","value":"displayVariant"}},{"kind":"Field","name":{"kind":"Name","value":"commandApprovalId"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AgentLogsQuery, AgentLogsQueryVariables>;
export const SendMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}},{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queued"}},{"kind":"Field","name":{"kind":"Name","value":"content"}}]}}]}}]} as unknown as DocumentNode<SendMessageMutation, SendMessageMutationVariables>;
export const RequestFileUploadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestFileUploads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"files"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FileUploadRequest"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestFileUploads"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}},{"kind":"Argument","name":{"kind":"Name","value":"files"},"value":{"kind":"Variable","name":{"kind":"Name","value":"files"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadId"}},{"kind":"Field","name":{"kind":"Name","value":"presignedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"key"}}]}}]}}]} as unknown as DocumentNode<RequestFileUploadsMutation, RequestFileUploadsMutationVariables>;
export const CompleteFileUploadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteFileUpload"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CompleteFileUploadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeFileUpload"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<CompleteFileUploadMutation, CompleteFileUploadMutationVariables>;
export const PendingInboxMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PendingInboxMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingInboxMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<PendingInboxMessagesQuery, PendingInboxMessagesQueryVariables>;
export const AgentLogCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AgentLogCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agentLogCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentLogFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"toolName"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolResult"}},{"kind":"Field","name":{"kind":"Name","value":"displayHint"}},{"kind":"Field","name":{"kind":"Name","value":"displayVariant"}},{"kind":"Field","name":{"kind":"Name","value":"commandApprovalId"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AgentLogCreatedSubscription, AgentLogCreatedSubscriptionVariables>;
export const LogCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LogCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentLogFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"toolName"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolResult"}},{"kind":"Field","name":{"kind":"Name","value":"displayHint"}},{"kind":"Field","name":{"kind":"Name","value":"displayVariant"}},{"kind":"Field","name":{"kind":"Name","value":"commandApprovalId"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LogCreatedSubscription, LogCreatedSubscriptionVariables>;
export const AgentStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AgentStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agentStream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logId"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"delta"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]} as unknown as DocumentNode<AgentStreamSubscription, AgentStreamSubscriptionVariables>;
export const SpeechUrlsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SpeechUrls"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"logId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"speechUrls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"logId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"logId"}}}]}]}}]} as unknown as DocumentNode<SpeechUrlsQuery, SpeechUrlsQueryVariables>;
export const DocumentSpeechUrlsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DocumentSpeechUrls"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"text"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documentSpeechUrls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"text"},"value":{"kind":"Variable","name":{"kind":"Name","value":"text"}}},{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}}]}]}}]} as unknown as DocumentNode<DocumentSpeechUrlsQuery, DocumentSpeechUrlsQueryVariables>;
export const SpeechStreamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SpeechStream"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"speechStream"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logId"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"sentenceIndex"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"done"}}]}}]}}]} as unknown as DocumentNode<SpeechStreamSubscription, SpeechStreamSubscriptionVariables>;
export const AgentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Agents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"voiceEnabled"}}]}}]} as unknown as DocumentNode<AgentsQuery, AgentsQueryVariables>;
export const AgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Agent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"portraitId"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"200"}}]},{"kind":"Field","name":{"kind":"Name","value":"personality"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"ttsVoice"}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"imageModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"speechModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sandbox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"idleTimeoutMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"alwaysOn"}},{"kind":"Field","name":{"kind":"Name","value":"commandApproval"}}]}},{"kind":"Field","name":{"kind":"Name","value":"webSearch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reasoning"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"imageGeneration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"speech"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"voice"}}]}},{"kind":"Field","name":{"kind":"Name","value":"manager"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"team"}}]}}]}}]}}]} as unknown as DocumentNode<AgentQuery, AgentQueryVariables>;
export const UpdateAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAgentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"portraitId"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"200"}}]},{"kind":"Field","name":{"kind":"Name","value":"personality"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"ttsVoice"}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"imageModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"speechModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sandbox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"idleTimeoutMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"alwaysOn"}},{"kind":"Field","name":{"kind":"Name","value":"commandApproval"}}]}},{"kind":"Field","name":{"kind":"Name","value":"webSearch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reasoning"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"imageGeneration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"speech"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"voice"}}]}},{"kind":"Field","name":{"kind":"Name","value":"manager"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"team"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAgentMutation, UpdateAgentMutationVariables>;
export const CreateAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAgentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"voiceEnabled"}}]}}]} as unknown as DocumentNode<CreateAgentMutation, CreateAgentMutationVariables>;
export const RetireAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RetireAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"retireAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"voiceEnabled"}}]}}]} as unknown as DocumentNode<RetireAgentMutation, RetireAgentMutationVariables>;
export const UnretireAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnretireAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unretireAgent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"voiceEnabled"}}]}}]} as unknown as DocumentNode<UnretireAgentMutation, UnretireAgentMutationVariables>;
export const AgentUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AgentUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agentUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"portraitId"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"200"}}]},{"kind":"Field","name":{"kind":"Name","value":"personality"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"ttsVoice"}},{"kind":"Field","name":{"kind":"Name","value":"config"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"imageModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"speechModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"connectionId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sandbox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"idleTimeoutMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"alwaysOn"}},{"kind":"Field","name":{"kind":"Name","value":"commandApproval"}}]}},{"kind":"Field","name":{"kind":"Name","value":"webSearch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reasoning"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"imageGeneration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}},{"kind":"Field","name":{"kind":"Name","value":"speech"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"voice"}}]}},{"kind":"Field","name":{"kind":"Name","value":"manager"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"team"}}]}}]}}]}}]} as unknown as DocumentNode<AgentUpdatedSubscription, AgentUpdatedSubscriptionVariables>;
export const CommandAllowlistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CommandAllowlist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commandAllowlist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pattern"}}]}}]}}]} as unknown as DocumentNode<CommandAllowlistQuery, CommandAllowlistQueryVariables>;
export const AddCommandAllowlistEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCommandAllowlistEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pattern"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCommandAllowlistEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pattern"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pattern"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pattern"}}]}}]}}]} as unknown as DocumentNode<AddCommandAllowlistEntryMutation, AddCommandAllowlistEntryMutationVariables>;
export const RemoveCommandAllowlistEntryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveCommandAllowlistEntry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pattern"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeCommandAllowlistEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pattern"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pattern"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pattern"}}]}}]}}]} as unknown as DocumentNode<RemoveCommandAllowlistEntryMutation, RemoveCommandAllowlistEntryMutationVariables>;
export const PendingCommandApprovalsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PendingCommandApprovals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingCommandApprovals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommandApprovalFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommandApprovalFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CommandApproval"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"command"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"decision"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<PendingCommandApprovalsQuery, PendingCommandApprovalsQueryVariables>;
export const ResolveCommandApprovalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResolveCommandApproval"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"decision"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommandApprovalDecision"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolveCommandApproval"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"decision"},"value":{"kind":"Variable","name":{"kind":"Name","value":"decision"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommandApprovalFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommandApprovalFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CommandApproval"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"command"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"decision"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<ResolveCommandApprovalMutation, ResolveCommandApprovalMutationVariables>;
export const IntegrationProvidersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IntegrationProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrationProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"connectionType"}},{"kind":"Field","name":{"kind":"Name","value":"authorizeUrl"}},{"kind":"Field","name":{"kind":"Name","value":"tokenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"defaultClientId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultScopes"}},{"kind":"Field","name":{"kind":"Name","value":"scopePrefix"}},{"kind":"Field","name":{"kind":"Name","value":"extraAuthParams"}},{"kind":"Field","name":{"kind":"Name","value":"userInfo"}},{"kind":"Field","name":{"kind":"Name","value":"ios"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"android"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"redirectUri"}}]}},{"kind":"Field","name":{"kind":"Name","value":"availableScopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"models"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasConnection"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultImageModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultSpeechModel"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}}]}}]}}]} as unknown as DocumentNode<IntegrationProvidersQuery, IntegrationProvidersQueryVariables>;
export const IntegrationConnectionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IntegrationConnections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrationConnections"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"excludeCategory"},"value":{"kind":"StringValue","value":"ai","block":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IntegrationConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IntegrationConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionType"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRevoked"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKeyConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AwsIamRoleConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"roleArn"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}}]} as unknown as DocumentNode<IntegrationConnectionsQuery, IntegrationConnectionsQueryVariables>;
export const AwsSetupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AwsSetup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"awsPresetRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"roleArn"}}]}},{"kind":"Field","name":{"kind":"Name","value":"awsSetupInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trustPolicy"}}]}}]}}]} as unknown as DocumentNode<AwsSetupQuery, AwsSetupQueryVariables>;
export const ConnectAwsIamRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConnectAwsIamRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleArn"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"region"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectAwsIamRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roleArn"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleArn"}}},{"kind":"Argument","name":{"kind":"Name","value":"displayName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}}},{"kind":"Argument","name":{"kind":"Name","value":"region"},"value":{"kind":"Variable","name":{"kind":"Name","value":"region"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IntegrationConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IntegrationConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionType"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRevoked"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKeyConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AwsIamRoleConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"roleArn"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}}]} as unknown as DocumentNode<ConnectAwsIamRoleMutation, ConnectAwsIamRoleMutationVariables>;
export const ConnectApiKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConnectApiKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectApiKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"apiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"apiKey"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectionId"}},{"kind":"Field","name":{"kind":"Name","value":"models"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}}]}}]}}]} as unknown as DocumentNode<ConnectApiKeyMutation, ConnectApiKeyMutationVariables>;
export const ProviderModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProviderModels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}}]}}]} as unknown as DocumentNode<ProviderModelsQuery, ProviderModelsQueryVariables>;
export const RevokeConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeIntegrationConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IntegrationConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IntegrationConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionType"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRevoked"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKeyConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AwsIamRoleConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"roleArn"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}}]} as unknown as DocumentNode<RevokeConnectionMutation, RevokeConnectionMutationVariables>;
export const SetDefaultModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDefaultModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"modelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}}]}}]}}]} as unknown as DocumentNode<SetDefaultModelMutation, SetDefaultModelMutationVariables>;
export const SetDefaultImageModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDefaultImageModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultImageModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"modelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}}]}}]}}]} as unknown as DocumentNode<SetDefaultImageModelMutation, SetDefaultImageModelMutationVariables>;
export const SetDefaultSpeechModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDefaultSpeechModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setDefaultSpeechModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"modelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}}]}}]}}]} as unknown as DocumentNode<SetDefaultSpeechModelMutation, SetDefaultSpeechModelMutationVariables>;
export const SpeechVoicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SpeechVoices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"connectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"speechVoices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"connectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"connectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"previewUrl"}}]}}]}}]} as unknown as DocumentNode<SpeechVoicesQuery, SpeechVoicesQueryVariables>;
export const EnabledModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EnabledModels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabledModels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}}]}]}}]} as unknown as DocumentNode<EnabledModelsQuery, EnabledModelsQueryVariables>;
export const AllEnabledModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AllEnabledModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allEnabledModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"modelMode"}}]}}]}}]} as unknown as DocumentNode<AllEnabledModelsQuery, AllEnabledModelsQueryVariables>;
export const EnableModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnableModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enableModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"modelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}},{"kind":"Argument","name":{"kind":"Name","value":"modelName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"modelMode"}}]}}]}}]} as unknown as DocumentNode<EnableModelMutation, EnableModelMutationVariables>;
export const DisableModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisableModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disableModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"modelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"modelId"}},{"kind":"Field","name":{"kind":"Name","value":"modelName"}},{"kind":"Field","name":{"kind":"Name","value":"modelMode"}}]}}]}}]} as unknown as DocumentNode<DisableModelMutation, DisableModelMutationVariables>;
export const BedrockEnabledModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BedrockEnabledModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bedrockEnabledModels"}}]}}]} as unknown as DocumentNode<BedrockEnabledModelsQuery, BedrockEnabledModelsQueryVariables>;
export const EnabledModelDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EnabledModelDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabledModelDetails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"maxInputTokens"}},{"kind":"Field","name":{"kind":"Name","value":"inputCostPerToken"}},{"kind":"Field","name":{"kind":"Name","value":"outputCostPerToken"}},{"kind":"Field","name":{"kind":"Name","value":"supportedModalities"}},{"kind":"Field","name":{"kind":"Name","value":"supportedOutputModalities"}},{"kind":"Field","name":{"kind":"Name","value":"inputCostPerImage"}},{"kind":"Field","name":{"kind":"Name","value":"inputCostPerImageToken"}},{"kind":"Field","name":{"kind":"Name","value":"outputCostPerImage"}},{"kind":"Field","name":{"kind":"Name","value":"outputCostPerImageToken"}},{"kind":"Field","name":{"kind":"Name","value":"supportsReasoning"}}]}}]}}]} as unknown as DocumentNode<EnabledModelDetailsQuery, EnabledModelDetailsQueryVariables>;
export const BedrockAvailableModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BedrockAvailableModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bedrockAvailableModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}}]}}]} as unknown as DocumentNode<BedrockAvailableModelsQuery, BedrockAvailableModelsQueryVariables>;
export const EnableBedrockModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EnableBedrockModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enableBedrockModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"modelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}]}]}}]} as unknown as DocumentNode<EnableBedrockModelMutation, EnableBedrockModelMutationVariables>;
export const DisableBedrockModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisableBedrockModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disableBedrockModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"modelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modelId"}}}]}]}}]} as unknown as DocumentNode<DisableBedrockModelMutation, DisableBedrockModelMutationVariables>;
export const SubmitOAuthConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitOAuthConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accessToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scopes"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitOAuthConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"providerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accessToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accessToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"refreshToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"expiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}}},{"kind":"Argument","name":{"kind":"Name","value":"scopes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scopes"}}},{"kind":"Argument","name":{"kind":"Name","value":"accountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"Argument","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"IntegrationConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"IntegrationConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"IntegrationConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"provider"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionType"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRevoked"}},{"kind":"Field","name":{"kind":"Name","value":"meta"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ApiKeyConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AwsIamRoleConnectionMeta"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"roleArn"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}}]} as unknown as DocumentNode<SubmitOAuthConnectionMutation, SubmitOAuthConnectionMutationVariables>;
export const AgentJobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AgentJobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agentJobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentJobSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}}]}}]} as unknown as DocumentNode<AgentJobsQuery, AgentJobsQueryVariables>;
export const AgentJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AgentJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agentJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentJobDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AgentJobQuery, AgentJobQueryVariables>;
export const DeleteAgentJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAgentJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAgentJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentJobSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}}]}}]} as unknown as DocumentNode<DeleteAgentJobMutation, DeleteAgentJobMutationVariables>;
export const UpdateAgentJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAgentJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAgentJobInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAgentJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentJobSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}}]}}]} as unknown as DocumentNode<UpdateAgentJobMutation, UpdateAgentJobMutationVariables>;
export const JobTaskCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"JobTaskCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"jobId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobTaskCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"jobId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"jobId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<JobTaskCreatedSubscription, JobTaskCreatedSubscriptionVariables>;
export const TriggerJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentJobSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}}]}}]} as unknown as DocumentNode<TriggerJobMutation, TriggerJobMutationVariables>;
export const JobCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"JobCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentJobSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}}]}}]} as unknown as DocumentNode<JobCreatedSubscription, JobCreatedSubscriptionVariables>;
export const CreateAgentJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAgentJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAgentJobInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAgentJob"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentJobSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentJobSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"}},{"kind":"Field","name":{"kind":"Name","value":"cronExpression"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paused"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"nextRun"}}]}}]} as unknown as DocumentNode<CreateAgentJobMutation, CreateAgentJobMutationVariables>;
export const ProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"about"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}}]}}]}}]} as unknown as DocumentNode<ProfileQuery, ProfileQueryVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"about"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}}]}}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const AvatarsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Avatars"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"avatars"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"200"}}]}]}}]}}]} as unknown as DocumentNode<AvatarsQuery, AvatarsQueryVariables>;
export const GlobalSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GlobalSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"globalSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signupDisabled"}}]}}]}}]} as unknown as DocumentNode<GlobalSettingsQuery, GlobalSettingsQueryVariables>;
export const UpdateGlobalSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGlobalSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"signupDisabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGlobalSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"signupDisabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"signupDisabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signupDisabled"}}]}}]}}]} as unknown as DocumentNode<UpdateGlobalSettingsMutation, UpdateGlobalSettingsMutationVariables>;
export const SkillTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SkillTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skillTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SkillTemplateFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}}]} as unknown as DocumentNode<SkillTemplatesQuery, SkillTemplatesQueryVariables>;
export const SkillTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SkillTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skillTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SkillTemplateFields"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}}]} as unknown as DocumentNode<SkillTemplateQuery, SkillTemplateQueryVariables>;
export const AgentSkillsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AgentSkills"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agentSkills"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSkillFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSkillFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentSkill"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skillId"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SkillTemplateFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionStatuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"boundConnectionIds"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<AgentSkillsQuery, AgentSkillsQueryVariables>;
export const AssignSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AssignSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"skillId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSkillFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSkillFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentSkill"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skillId"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SkillTemplateFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionStatuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"boundConnectionIds"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<AssignSkillMutation, AssignSkillMutationVariables>;
export const RemoveSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"skillId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSkillFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSkillFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentSkill"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skillId"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SkillTemplateFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionStatuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"boundConnectionIds"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<RemoveSkillMutation, RemoveSkillMutationVariables>;
export const BindAgentSkillConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BindAgentSkillConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"connectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bindAgentSkillConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"skillId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}},{"kind":"Argument","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}},{"kind":"Argument","name":{"kind":"Name","value":"connectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"connectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSkillFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSkillFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentSkill"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skillId"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SkillTemplateFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionStatuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"boundConnectionIds"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<BindAgentSkillConnectionMutation, BindAgentSkillConnectionMutationVariables>;
export const UnbindAgentSkillConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnbindAgentSkillConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"connectionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unbindAgentSkillConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"skillId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}},{"kind":"Argument","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}},{"kind":"Argument","name":{"kind":"Name","value":"connectionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"connectionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSkillFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SkillTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SkillTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"hasInstall"}},{"kind":"Field","name":{"kind":"Name","value":"connections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"requestedScopes"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSkillFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentSkill"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skillId"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"assignedAt"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SkillTemplateFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectionStatuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"providerName"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"optional"}},{"kind":"Field","name":{"kind":"Name","value":"multi"}},{"kind":"Field","name":{"kind":"Name","value":"boundConnectionIds"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<UnbindAgentSkillConnectionMutation, UnbindAgentSkillConnectionMutationVariables>;
export const TasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Tasks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"last"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"before"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"last"},"value":{"kind":"Variable","name":{"kind":"Name","value":"last"}}},{"kind":"Argument","name":{"kind":"Name","value":"before"},"value":{"kind":"Variable","name":{"kind":"Name","value":"before"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskSummary"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Agent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"delegationHint"}},{"kind":"Field","name":{"kind":"Name","value":"retired"}},{"kind":"Field","name":{"kind":"Name","value":"voiceEnabled"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"emoji"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}}]} as unknown as DocumentNode<TasksQuery, TasksQueryVariables>;
export const TaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Task"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"emoji"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}}]} as unknown as DocumentNode<TaskQuery, TaskQueryVariables>;
export const TaskLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TaskLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"last"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"before"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"last"},"value":{"kind":"Variable","name":{"kind":"Name","value":"last"}}},{"kind":"Argument","name":{"kind":"Name","value":"before"},"value":{"kind":"Variable","name":{"kind":"Name","value":"before"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentLogFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"toolName"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolResult"}},{"kind":"Field","name":{"kind":"Name","value":"displayHint"}},{"kind":"Field","name":{"kind":"Name","value":"displayVariant"}},{"kind":"Field","name":{"kind":"Name","value":"commandApprovalId"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<TaskLogsQuery, TaskLogsQueryVariables>;
export const TaskLogCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TaskLogCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskLogCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentLogFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"toolName"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolResult"}},{"kind":"Field","name":{"kind":"Name","value":"displayHint"}},{"kind":"Field","name":{"kind":"Name","value":"displayVariant"}},{"kind":"Field","name":{"kind":"Name","value":"commandApprovalId"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<TaskLogCreatedSubscription, TaskLogCreatedSubscriptionVariables>;
export const TaskUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TaskUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TaskDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"File"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AttachmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Attachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkAttachment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TaskDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Task"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"emoji"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AttachmentFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFields"}}]}}]}}]} as unknown as DocumentNode<TaskUpdatedSubscription, TaskUpdatedSubscriptionVariables>;
export const SandboxOutputDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SandboxOutput"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sandboxOutput"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commandId"}},{"kind":"Field","name":{"kind":"Name","value":"stream"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"exitCode"}}]}}]}}]} as unknown as DocumentNode<SandboxOutputSubscription, SandboxOutputSubscriptionVariables>;
export const UserInputRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserInputRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userInputRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInputRequestFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInputRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserInputRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"turnId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"style"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAction"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<UserInputRequestsQuery, UserInputRequestsQueryVariables>;
export const ResolveUserInputRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResolveUserInputRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolveUserInputRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInputRequestFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInputRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserInputRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"turnId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"style"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAction"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<ResolveUserInputRequestMutation, ResolveUserInputRequestMutationVariables>;
export const DismissUserInputRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DismissUserInputRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dismissUserInputRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInputRequestFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInputRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserInputRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"turnId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"style"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAction"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<DismissUserInputRequestMutation, DismissUserInputRequestMutationVariables>;
export const PendingItemsUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PendingItemsUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingItemsUpdated"}}]}}]} as unknown as DocumentNode<PendingItemsUpdatedSubscription, PendingItemsUpdatedSubscriptionVariables>;
export const WorkspaceEntriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkspaceEntries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceEntries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"isDirectory"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}}]}}]}}]} as unknown as DocumentNode<WorkspaceEntriesQuery, WorkspaceEntriesQueryVariables>;
export const WorkspaceFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkspaceFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}]}]}}]} as unknown as DocumentNode<WorkspaceFileQuery, WorkspaceFileQueryVariables>;
export const FileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"File"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"path"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"path"},"value":{"kind":"Variable","name":{"kind":"Name","value":"path"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"modifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"render"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markdown"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CodeRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"800"}}]},{"kind":"Field","alias":{"kind":"Name","value":"fullUrl"},"name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"aspectRatio"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AudioRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VideoRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnailUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"width"},"value":{"kind":"IntValue","value":"400"}}]},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnknownRender"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBytes"}}]}}]}}]}}]}}]} as unknown as DocumentNode<FileQuery, FileQueryVariables>;