import { UserInputRequestStatus } from '@opengremlin/lib/enums.js';
import { ToolName } from '@opengremlin/lib/enums.js';
import { GraphQLResolveInfo } from 'graphql';
import { AgentItem } from '@opengremlin/lib/resources/ddb/schema/agent.js';
import { AgentJobItem } from '@opengremlin/lib/resources/ddb/schema/agentJob.js';
import { AgentLogItem } from '@opengremlin/lib/resources/ddb/schema/agentLog.js';
import { AgentLogConnectionModel, AgentLogEdgeModel, PageInfoModel } from '@opengremlin/lib/services/agentLogs/pagination.js';
import { AvatarModel } from './schema/Avatar/resolvers.js';
import { IntegrationProviderDef } from '@opengremlin/lib/services/integrations/providers.js';
import { SafeIntegrationConnection } from '@opengremlin/lib/services/integrations/getConnections.js';
import { DefaultModelResult } from '@opengremlin/lib/services/integrations/getDefaultModel.js';
import { UserInputRequestItem } from '@opengremlin/lib/resources/ddb/schema/userInputRequest.js';
import { ProfileItem } from '@opengremlin/lib/resources/ddb/schema/profile.js';
import { AgentSkillItem } from '@opengremlin/lib/resources/ddb/schema/agentSkill.js';
import { SkillTemplate as SkillTemplateModel } from '@opengremlin/lib/services/skills/registry.js';
import { TaskItem } from '@opengremlin/lib/resources/ddb/schema/task.js';
import { TaskConnectionModel, TaskEdgeModel, TaskPageInfoModel } from '@opengremlin/lib/services/tasks/pagination.js';
import { GremlinContext } from './context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
export type EnumResolverSignature<T, AllowedValues = any> = { [key in keyof T]?: AllowedValues };
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
  providerId: Scalars['String']['input'];
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

export { ToolName };

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

export { UserInputRequestStatus };

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
  Attachment:
    | ( Omit<FileAttachment, 'file'> & { file: _RefType['File'] } )
    | ( LinkAttachment )
  ;
  ConnectionMeta:
    | ( ApiKeyConnectionMeta )
    | ( AwsIamRoleConnectionMeta )
    | ( OAuthConnectionMeta )
  ;
  FileRender:
    | ( AudioRender )
    | ( CodeRender )
    | ( DocumentRender )
    | ( ImageRender )
    | ( UnknownRender )
    | ( VideoRender )
  ;
};


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Agent: ResolverTypeWrapper<AgentItem>;
  AgentConfig: ResolverTypeWrapper<AgentConfig>;
  AgentConfigInput: AgentConfigInput;
  AgentImageGenerationConfig: ResolverTypeWrapper<AgentImageGenerationConfig>;
  AgentImageGenerationConfigInput: AgentImageGenerationConfigInput;
  AgentJob: ResolverTypeWrapper<AgentJobItem>;
  AgentLog: ResolverTypeWrapper<AgentLogItem>;
  AgentLogConnection: ResolverTypeWrapper<AgentLogConnectionModel>;
  AgentLogEdge: ResolverTypeWrapper<AgentLogEdgeModel>;
  AgentLogPageInfo: ResolverTypeWrapper<PageInfoModel>;
  AgentLogRole: AgentLogRole;
  AgentManagerConfig: ResolverTypeWrapper<AgentManagerConfig>;
  AgentManagerConfigInput: AgentManagerConfigInput;
  AgentModelConfig: ResolverTypeWrapper<AgentModelConfig>;
  AgentModelConfigInput: AgentModelConfigInput;
  AgentReasoningConfig: ResolverTypeWrapper<AgentReasoningConfig>;
  AgentReasoningConfigInput: AgentReasoningConfigInput;
  AgentSandboxConfig: ResolverTypeWrapper<AgentSandboxConfig>;
  AgentSandboxConfigInput: AgentSandboxConfigInput;
  AgentSkill: ResolverTypeWrapper<AgentSkillItem>;
  AgentSpeechConfig: ResolverTypeWrapper<AgentSpeechConfig>;
  AgentSpeechConfigInput: AgentSpeechConfigInput;
  AgentStreamDelta: ResolverTypeWrapper<AgentStreamDelta>;
  AgentViewImageConfig: ResolverTypeWrapper<AgentViewImageConfig>;
  AgentViewImageConfigInput: AgentViewImageConfigInput;
  AgentWebSearchConfig: ResolverTypeWrapper<AgentWebSearchConfig>;
  AgentWebSearchConfigInput: AgentWebSearchConfigInput;
  AllowlistEntry: ResolverTypeWrapper<AllowlistEntry>;
  ApiKeyConnectionMeta: ResolverTypeWrapper<ApiKeyConnectionMeta>;
  Attachment: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['Attachment']>;
  AudioRender: ResolverTypeWrapper<AudioRender>;
  AvailableScope: ResolverTypeWrapper<AvailableScope>;
  Avatar: ResolverTypeWrapper<AvatarModel>;
  AwsIamRoleConnectionMeta: ResolverTypeWrapper<AwsIamRoleConnectionMeta>;
  AwsPresetRole: ResolverTypeWrapper<AwsPresetRole>;
  AwsSetupInfo: ResolverTypeWrapper<AwsSetupInfo>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CodeRender: ResolverTypeWrapper<CodeRender>;
  CommandApproval: ResolverTypeWrapper<Omit<CommandApproval, 'agent'> & { agent: ResolversTypes['Agent'] }>;
  CommandApprovalDecision: CommandApprovalDecision;
  CommandApprovalStatus: CommandApprovalStatus;
  CompleteFileUploadInput: CompleteFileUploadInput;
  CompletedFileUpload: ResolverTypeWrapper<CompletedFileUpload>;
  ConnectApiKeyResult: ResolverTypeWrapper<ConnectApiKeyResult>;
  ConnectionMeta: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ConnectionMeta']>;
  CreateAgentInput: CreateAgentInput;
  CreateAgentJobInput: CreateAgentJobInput;
  DefaultModel: ResolverTypeWrapper<DefaultModelResult>;
  Document: ResolverTypeWrapper<Document>;
  DocumentRender: ResolverTypeWrapper<DocumentRender>;
  EnabledModelEntry: ResolverTypeWrapper<EnabledModelEntry>;
  File: ResolverTypeWrapper<Omit<File, 'render'> & { render: ResolversTypes['FileRender'] }>;
  FileAttachment: ResolverTypeWrapper<Omit<FileAttachment, 'file'> & { file: ResolversTypes['File'] }>;
  FileRender: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['FileRender']>;
  FileUploadRequest: FileUploadRequest;
  FileUploadUrl: ResolverTypeWrapper<FileUploadUrl>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GlobalSettings: ResolverTypeWrapper<GlobalSettings>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  ImageRender: ResolverTypeWrapper<ImageRender>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  IntegrationConnection: ResolverTypeWrapper<SafeIntegrationConnection>;
  IntegrationProvider: ResolverTypeWrapper<IntegrationProviderDef>;
  LinkAttachment: ResolverTypeWrapper<LinkAttachment>;
  ModelInfo: ResolverTypeWrapper<ModelInfo>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  OAuthConnectionMeta: ResolverTypeWrapper<OAuthConnectionMeta>;
  OAuthPlatformOverride: ResolverTypeWrapper<OAuthPlatformOverride>;
  PendingInboxMessage: ResolverTypeWrapper<PendingInboxMessage>;
  Profile: ResolverTypeWrapper<ProfileItem>;
  ProfileInput: ProfileInput;
  ProviderModelInfo: ResolverTypeWrapper<ProviderModelInfo>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SandboxOutput: ResolverTypeWrapper<SandboxOutput>;
  SendMessageResult: ResolverTypeWrapper<SendMessageResult>;
  SkillConnectionRequirement: ResolverTypeWrapper<SkillConnectionRequirement>;
  SkillConnectionStatus: ResolverTypeWrapper<SkillConnectionStatus>;
  SkillTemplate: ResolverTypeWrapper<SkillTemplateModel>;
  SpeechAudioChunk: ResolverTypeWrapper<SpeechAudioChunk>;
  SpeechVoice: ResolverTypeWrapper<SpeechVoice>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Task: ResolverTypeWrapper<TaskItem>;
  TaskConnection: ResolverTypeWrapper<TaskConnectionModel>;
  TaskEdge: ResolverTypeWrapper<TaskEdgeModel>;
  TaskPageInfo: ResolverTypeWrapper<TaskPageInfoModel>;
  ToolName: ToolName;
  UnknownRender: ResolverTypeWrapper<UnknownRender>;
  UpdateAgentInput: UpdateAgentInput;
  UpdateAgentJobInput: UpdateAgentJobInput;
  UserInputRequest: ResolverTypeWrapper<UserInputRequestItem>;
  UserInputRequestAction: ResolverTypeWrapper<UserInputRequestAction>;
  UserInputRequestStatus: UserInputRequestStatus;
  VideoRender: ResolverTypeWrapper<VideoRender>;
  WorkspaceEntry: ResolverTypeWrapper<WorkspaceEntry>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Agent: AgentItem;
  AgentConfig: AgentConfig;
  AgentConfigInput: AgentConfigInput;
  AgentImageGenerationConfig: AgentImageGenerationConfig;
  AgentImageGenerationConfigInput: AgentImageGenerationConfigInput;
  AgentJob: AgentJobItem;
  AgentLog: AgentLogItem;
  AgentLogConnection: AgentLogConnectionModel;
  AgentLogEdge: AgentLogEdgeModel;
  AgentLogPageInfo: PageInfoModel;
  AgentManagerConfig: AgentManagerConfig;
  AgentManagerConfigInput: AgentManagerConfigInput;
  AgentModelConfig: AgentModelConfig;
  AgentModelConfigInput: AgentModelConfigInput;
  AgentReasoningConfig: AgentReasoningConfig;
  AgentReasoningConfigInput: AgentReasoningConfigInput;
  AgentSandboxConfig: AgentSandboxConfig;
  AgentSandboxConfigInput: AgentSandboxConfigInput;
  AgentSkill: AgentSkillItem;
  AgentSpeechConfig: AgentSpeechConfig;
  AgentSpeechConfigInput: AgentSpeechConfigInput;
  AgentStreamDelta: AgentStreamDelta;
  AgentViewImageConfig: AgentViewImageConfig;
  AgentViewImageConfigInput: AgentViewImageConfigInput;
  AgentWebSearchConfig: AgentWebSearchConfig;
  AgentWebSearchConfigInput: AgentWebSearchConfigInput;
  AllowlistEntry: AllowlistEntry;
  ApiKeyConnectionMeta: ApiKeyConnectionMeta;
  Attachment: ResolversUnionTypes<ResolversParentTypes>['Attachment'];
  AudioRender: AudioRender;
  AvailableScope: AvailableScope;
  Avatar: AvatarModel;
  AwsIamRoleConnectionMeta: AwsIamRoleConnectionMeta;
  AwsPresetRole: AwsPresetRole;
  AwsSetupInfo: AwsSetupInfo;
  Boolean: Scalars['Boolean']['output'];
  CodeRender: CodeRender;
  CommandApproval: Omit<CommandApproval, 'agent'> & { agent: ResolversParentTypes['Agent'] };
  CompleteFileUploadInput: CompleteFileUploadInput;
  CompletedFileUpload: CompletedFileUpload;
  ConnectApiKeyResult: ConnectApiKeyResult;
  ConnectionMeta: ResolversUnionTypes<ResolversParentTypes>['ConnectionMeta'];
  CreateAgentInput: CreateAgentInput;
  CreateAgentJobInput: CreateAgentJobInput;
  DefaultModel: DefaultModelResult;
  Document: Document;
  DocumentRender: DocumentRender;
  EnabledModelEntry: EnabledModelEntry;
  File: Omit<File, 'render'> & { render: ResolversParentTypes['FileRender'] };
  FileAttachment: Omit<FileAttachment, 'file'> & { file: ResolversParentTypes['File'] };
  FileRender: ResolversUnionTypes<ResolversParentTypes>['FileRender'];
  FileUploadRequest: FileUploadRequest;
  FileUploadUrl: FileUploadUrl;
  Float: Scalars['Float']['output'];
  GlobalSettings: GlobalSettings;
  ID: Scalars['ID']['output'];
  ImageRender: ImageRender;
  Int: Scalars['Int']['output'];
  IntegrationConnection: SafeIntegrationConnection;
  IntegrationProvider: IntegrationProviderDef;
  LinkAttachment: LinkAttachment;
  ModelInfo: ModelInfo;
  Mutation: Record<PropertyKey, never>;
  OAuthConnectionMeta: OAuthConnectionMeta;
  OAuthPlatformOverride: OAuthPlatformOverride;
  PendingInboxMessage: PendingInboxMessage;
  Profile: ProfileItem;
  ProfileInput: ProfileInput;
  ProviderModelInfo: ProviderModelInfo;
  Query: Record<PropertyKey, never>;
  SandboxOutput: SandboxOutput;
  SendMessageResult: SendMessageResult;
  SkillConnectionRequirement: SkillConnectionRequirement;
  SkillConnectionStatus: SkillConnectionStatus;
  SkillTemplate: SkillTemplateModel;
  SpeechAudioChunk: SpeechAudioChunk;
  SpeechVoice: SpeechVoice;
  String: Scalars['String']['output'];
  Subscription: Record<PropertyKey, never>;
  Task: TaskItem;
  TaskConnection: TaskConnectionModel;
  TaskEdge: TaskEdgeModel;
  TaskPageInfo: TaskPageInfoModel;
  UnknownRender: UnknownRender;
  UpdateAgentInput: UpdateAgentInput;
  UpdateAgentJobInput: UpdateAgentJobInput;
  UserInputRequest: UserInputRequestItem;
  UserInputRequestAction: UserInputRequestAction;
  VideoRender: VideoRender;
  WorkspaceEntry: WorkspaceEntry;
};

export type AgentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Agent'] = ResolversParentTypes['Agent']> = {
  avatar?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  config?: Resolver<Maybe<ResolversTypes['AgentConfig']>, ParentType, ContextType>;
  delegationHint?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<AgentImageUrlArgs>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  personality?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  portraitId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  retired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  role?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ttsVoice?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  voiceEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type AgentConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentConfig'] = ResolversParentTypes['AgentConfig']> = {
  imageGeneration?: Resolver<Maybe<ResolversTypes['AgentImageGenerationConfig']>, ParentType, ContextType>;
  imageModel?: Resolver<Maybe<ResolversTypes['AgentModelConfig']>, ParentType, ContextType>;
  manager?: Resolver<Maybe<ResolversTypes['AgentManagerConfig']>, ParentType, ContextType>;
  model?: Resolver<Maybe<ResolversTypes['AgentModelConfig']>, ParentType, ContextType>;
  reasoning?: Resolver<Maybe<ResolversTypes['AgentReasoningConfig']>, ParentType, ContextType>;
  sandbox?: Resolver<Maybe<ResolversTypes['AgentSandboxConfig']>, ParentType, ContextType>;
  speech?: Resolver<Maybe<ResolversTypes['AgentSpeechConfig']>, ParentType, ContextType>;
  speechModel?: Resolver<Maybe<ResolversTypes['AgentModelConfig']>, ParentType, ContextType>;
  viewImage?: Resolver<Maybe<ResolversTypes['AgentViewImageConfig']>, ParentType, ContextType>;
  webSearch?: Resolver<Maybe<ResolversTypes['AgentWebSearchConfig']>, ParentType, ContextType>;
};

export type AgentImageGenerationConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentImageGenerationConfig'] = ResolversParentTypes['AgentImageGenerationConfig']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type AgentJobResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentJob'] = ResolversParentTypes['AgentJob']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  cronExpression?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastRun?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nextRun?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  paused?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  recurrence?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tasks?: Resolver<Array<ResolversTypes['Task']>, ParentType, ContextType>;
  timezone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type AgentLogResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentLog'] = ResolversParentTypes['AgentLog']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  attachments?: Resolver<Array<ResolversTypes['Attachment']>, ParentType, ContextType>;
  commandApprovalId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayHint?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayVariant?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  documents?: Resolver<Array<ResolversTypes['Document']>, ParentType, ContextType>;
  files?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['AgentLogRole'], ParentType, ContextType>;
  taskId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  toolInput?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  toolName?: Resolver<Maybe<ResolversTypes['ToolName']>, ParentType, ContextType>;
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

export type AgentManagerConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentManagerConfig'] = ResolversParentTypes['AgentManagerConfig']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  team?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type AgentModelConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentModelConfig'] = ResolversParentTypes['AgentModelConfig']> = {
  connectionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  modelId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type AgentReasoningConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentReasoningConfig'] = ResolversParentTypes['AgentReasoningConfig']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type AgentSandboxConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentSandboxConfig'] = ResolversParentTypes['AgentSandboxConfig']> = {
  alwaysOn?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  commandApproval?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  idleTimeoutMinutes?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type AgentSkillResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentSkill'] = ResolversParentTypes['AgentSkill']> = {
  agentId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  assignedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  connectionStatuses?: Resolver<Array<ResolversTypes['SkillConnectionStatus']>, ParentType, ContextType>;
  skillId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  template?: Resolver<Maybe<ResolversTypes['SkillTemplate']>, ParentType, ContextType>;
};

export type AgentSpeechConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentSpeechConfig'] = ResolversParentTypes['AgentSpeechConfig']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  voice?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type AgentStreamDeltaResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentStreamDelta'] = ResolversParentTypes['AgentStreamDelta']> = {
  agentId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  delta?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  done?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  logId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  taskId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type AgentViewImageConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentViewImageConfig'] = ResolversParentTypes['AgentViewImageConfig']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type AgentWebSearchConfigResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentWebSearchConfig'] = ResolversParentTypes['AgentWebSearchConfig']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  provider?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type AllowlistEntryResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AllowlistEntry'] = ResolversParentTypes['AllowlistEntry']> = {
  pattern?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ApiKeyConnectionMetaResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ApiKeyConnectionMeta'] = ResolversParentTypes['ApiKeyConnectionMeta']> = {
  accountId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AttachmentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Attachment'] = ResolversParentTypes['Attachment']> = {
  __resolveType: TypeResolveFn<'FileAttachment' | 'LinkAttachment', ParentType, ContextType>;
};

export type AudioRenderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AudioRender'] = ResolversParentTypes['AudioRender']> = {
  durationSeconds?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type AwsIamRoleConnectionMetaResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AwsIamRoleConnectionMeta'] = ResolversParentTypes['AwsIamRoleConnectionMeta']> = {
  accountId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  roleArn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AwsPresetRoleResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AwsPresetRole'] = ResolversParentTypes['AwsPresetRole']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  roleArn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type AwsSetupInfoResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AwsSetupInfo'] = ResolversParentTypes['AwsSetupInfo']> = {
  trustPolicy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type CodeRenderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['CodeRender'] = ResolversParentTypes['CodeRender']> = {
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  language?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommandApprovalResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['CommandApproval'] = ResolversParentTypes['CommandApproval']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  command?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  decision?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolvedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['CommandApprovalStatus'], ParentType, ContextType>;
  taskId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type CompletedFileUploadResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['CompletedFileUpload'] = ResolversParentTypes['CompletedFileUpload']> = {
  contentType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ConnectApiKeyResultResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ConnectApiKeyResult'] = ResolversParentTypes['ConnectApiKeyResult']> = {
  connectionId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  models?: Resolver<Array<ResolversTypes['ProviderModelInfo']>, ParentType, ContextType>;
};

export type ConnectionMetaResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ConnectionMeta'] = ResolversParentTypes['ConnectionMeta']> = {
  __resolveType: TypeResolveFn<'ApiKeyConnectionMeta' | 'AwsIamRoleConnectionMeta' | 'OAuthConnectionMeta', ParentType, ContextType>;
};

export type DefaultModelResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['DefaultModel'] = ResolversParentTypes['DefaultModel']> = {
  modelId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modelName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  providerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DocumentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Document'] = ResolversParentTypes['Document']> = {
  body?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DocumentRenderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['DocumentRender'] = ResolversParentTypes['DocumentRender']> = {
  markdown?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EnabledModelEntryResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['EnabledModelEntry'] = ResolversParentTypes['EnabledModelEntry']> = {
  modelId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modelMode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modelName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  providerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type FileResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['File'] = ResolversParentTypes['File']> = {
  mimeType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  modifiedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  render?: Resolver<ResolversTypes['FileRender'], ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type FileAttachmentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['FileAttachment'] = ResolversParentTypes['FileAttachment']> = {
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FileRenderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['FileRender'] = ResolversParentTypes['FileRender']> = {
  __resolveType: TypeResolveFn<'AudioRender' | 'CodeRender' | 'DocumentRender' | 'ImageRender' | 'UnknownRender' | 'VideoRender', ParentType, ContextType>;
};

export type FileUploadUrlResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['FileUploadUrl'] = ResolversParentTypes['FileUploadUrl']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  presignedUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type GlobalSettingsResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['GlobalSettings'] = ResolversParentTypes['GlobalSettings']> = {
  signupDisabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type ImageRenderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ImageRender'] = ResolversParentTypes['ImageRender']> = {
  aspectRatio?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  height?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<ImageRenderUrlArgs>>;
  width?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IntegrationConnectionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['IntegrationConnection'] = ResolversParentTypes['IntegrationConnection']> = {
  connectedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  connectionType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isRevoked?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  meta?: Resolver<ResolversTypes['ConnectionMeta'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['IntegrationProvider'], ParentType, ContextType>;
  providerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type IntegrationProviderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['IntegrationProvider'] = ResolversParentTypes['IntegrationProvider']> = {
  android?: Resolver<Maybe<ResolversTypes['OAuthPlatformOverride']>, ParentType, ContextType>;
  authorizeUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  availableScopes?: Resolver<Array<ResolversTypes['AvailableScope']>, ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  connectionCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  connectionType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  defaultClientId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  defaultScopes?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  extraAuthParams?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasConnection?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  ios?: Resolver<Maybe<ResolversTypes['OAuthPlatformOverride']>, ParentType, ContextType>;
  models?: Resolver<Maybe<Array<ResolversTypes['ModelInfo']>>, ParentType, ContextType>;
  scopePrefix?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  service?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userInfo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type LinkAttachmentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['LinkAttachment'] = ResolversParentTypes['LinkAttachment']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ModelInfoResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ModelInfo'] = ResolversParentTypes['ModelInfo']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inputCostPerImage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  inputCostPerImageToken?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  inputCostPerToken?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  maxInputTokens?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  mode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  outputCostPerImage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  outputCostPerImageToken?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  outputCostPerToken?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  supportedModalities?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  supportedOutputModalities?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  supportsReasoning?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  addCommandAllowlistEntry?: Resolver<Array<ResolversTypes['AllowlistEntry']>, ParentType, ContextType, RequireFields<MutationAddCommandAllowlistEntryArgs, 'agentId' | 'pattern'>>;
  assignSkill?: Resolver<ResolversTypes['AgentSkill'], ParentType, ContextType, RequireFields<MutationAssignSkillArgs, 'agentId' | 'skillId'>>;
  bindAgentSkillConnection?: Resolver<ResolversTypes['AgentSkill'], ParentType, ContextType, RequireFields<MutationBindAgentSkillConnectionArgs, 'agentId' | 'connectionId' | 'provider' | 'skillId'>>;
  completeFileUpload?: Resolver<ResolversTypes['CompletedFileUpload'], ParentType, ContextType, RequireFields<MutationCompleteFileUploadArgs, 'input'>>;
  connectApiKey?: Resolver<ResolversTypes['ConnectApiKeyResult'], ParentType, ContextType, RequireFields<MutationConnectApiKeyArgs, 'apiKey' | 'providerId'>>;
  connectAwsIamRole?: Resolver<ResolversTypes['IntegrationConnection'], ParentType, ContextType, RequireFields<MutationConnectAwsIamRoleArgs, 'roleArn'>>;
  createAgent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType, RequireFields<MutationCreateAgentArgs, 'input'>>;
  createAgentJob?: Resolver<ResolversTypes['AgentJob'], ParentType, ContextType, RequireFields<MutationCreateAgentJobArgs, 'input'>>;
  deleteAgentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<MutationDeleteAgentJobArgs, 'id'>>;
  disableBedrockModel?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationDisableBedrockModelArgs, 'modelId'>>;
  disableModel?: Resolver<Array<ResolversTypes['EnabledModelEntry']>, ParentType, ContextType, RequireFields<MutationDisableModelArgs, 'modelId' | 'providerId'>>;
  dismissUserInputRequest?: Resolver<Maybe<ResolversTypes['UserInputRequest']>, ParentType, ContextType, RequireFields<MutationDismissUserInputRequestArgs, 'id'>>;
  enableBedrockModel?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationEnableBedrockModelArgs, 'modelId'>>;
  enableModel?: Resolver<Array<ResolversTypes['EnabledModelEntry']>, ParentType, ContextType, RequireFields<MutationEnableModelArgs, 'modelId' | 'providerId'>>;
  removeCommandAllowlistEntry?: Resolver<Array<ResolversTypes['AllowlistEntry']>, ParentType, ContextType, RequireFields<MutationRemoveCommandAllowlistEntryArgs, 'agentId' | 'pattern'>>;
  removeSkill?: Resolver<ResolversTypes['AgentSkill'], ParentType, ContextType, RequireFields<MutationRemoveSkillArgs, 'agentId' | 'skillId'>>;
  requestFileUploads?: Resolver<Array<ResolversTypes['FileUploadUrl']>, ParentType, ContextType, RequireFields<MutationRequestFileUploadsArgs, 'agentId' | 'files'>>;
  resolveCommandApproval?: Resolver<Maybe<ResolversTypes['CommandApproval']>, ParentType, ContextType, RequireFields<MutationResolveCommandApprovalArgs, 'decision' | 'id'>>;
  resolveUserInputRequest?: Resolver<Maybe<ResolversTypes['UserInputRequest']>, ParentType, ContextType, RequireFields<MutationResolveUserInputRequestArgs, 'action' | 'id'>>;
  retireAgent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType, RequireFields<MutationRetireAgentArgs, 'id'>>;
  revokeIntegrationConnection?: Resolver<ResolversTypes['IntegrationConnection'], ParentType, ContextType, RequireFields<MutationRevokeIntegrationConnectionArgs, 'id'>>;
  sendMessage?: Resolver<ResolversTypes['SendMessageResult'], ParentType, ContextType, RequireFields<MutationSendMessageArgs, 'agentId' | 'content'>>;
  setDefaultImageModel?: Resolver<ResolversTypes['DefaultModel'], ParentType, ContextType, RequireFields<MutationSetDefaultImageModelArgs, 'modelId' | 'providerId'>>;
  setDefaultModel?: Resolver<ResolversTypes['DefaultModel'], ParentType, ContextType, RequireFields<MutationSetDefaultModelArgs, 'modelId' | 'providerId'>>;
  setDefaultSpeechModel?: Resolver<ResolversTypes['DefaultModel'], ParentType, ContextType, RequireFields<MutationSetDefaultSpeechModelArgs, 'modelId' | 'providerId'>>;
  submitOAuthConnection?: Resolver<ResolversTypes['IntegrationConnection'], ParentType, ContextType, RequireFields<MutationSubmitOAuthConnectionArgs, 'accessToken' | 'providerId' | 'scopes'>>;
  triggerJob?: Resolver<ResolversTypes['AgentJob'], ParentType, ContextType, RequireFields<MutationTriggerJobArgs, 'id'>>;
  unbindAgentSkillConnection?: Resolver<ResolversTypes['AgentSkill'], ParentType, ContextType, RequireFields<MutationUnbindAgentSkillConnectionArgs, 'agentId' | 'connectionId' | 'provider' | 'skillId'>>;
  unretireAgent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType, RequireFields<MutationUnretireAgentArgs, 'id'>>;
  updateAgent?: Resolver<Maybe<ResolversTypes['Agent']>, ParentType, ContextType, RequireFields<MutationUpdateAgentArgs, 'id' | 'input'>>;
  updateAgentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<MutationUpdateAgentJobArgs, 'id' | 'input'>>;
  updateGlobalSettings?: Resolver<ResolversTypes['GlobalSettings'], ParentType, ContextType, Partial<MutationUpdateGlobalSettingsArgs>>;
  updateProfile?: Resolver<ResolversTypes['Profile'], ParentType, ContextType, RequireFields<MutationUpdateProfileArgs, 'input'>>;
};

export type OAuthConnectionMetaResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['OAuthConnectionMeta'] = ResolversParentTypes['OAuthConnectionMeta']> = {
  accountId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  expiresAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scopes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OAuthPlatformOverrideResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['OAuthPlatformOverride'] = ResolversParentTypes['OAuthPlatformOverride']> = {
  clientId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  redirectUri?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PendingInboxMessageResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['PendingInboxMessage'] = ResolversParentTypes['PendingInboxMessage']> = {
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type ProfileResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Profile'] = ResolversParentTypes['Profile']> = {
  about?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timezone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  website?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ProviderModelInfoResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['ProviderModelInfo'] = ResolversParentTypes['ProviderModelInfo']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  agent?: Resolver<Maybe<ResolversTypes['Agent']>, ParentType, ContextType, RequireFields<QueryAgentArgs, 'id'>>;
  agentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<QueryAgentJobArgs, 'id'>>;
  agentJobs?: Resolver<Array<ResolversTypes['AgentJob']>, ParentType, ContextType>;
  agentLogs?: Resolver<ResolversTypes['AgentLogConnection'], ParentType, ContextType, RequireFields<QueryAgentLogsArgs, 'agentId'>>;
  agentSkills?: Resolver<Array<ResolversTypes['AgentSkill']>, ParentType, ContextType, RequireFields<QueryAgentSkillsArgs, 'agentId'>>;
  agents?: Resolver<Array<ResolversTypes['Agent']>, ParentType, ContextType>;
  allEnabledModels?: Resolver<Array<ResolversTypes['EnabledModelEntry']>, ParentType, ContextType>;
  avatars?: Resolver<Array<ResolversTypes['Avatar']>, ParentType, ContextType>;
  awsPresetRoles?: Resolver<Array<ResolversTypes['AwsPresetRole']>, ParentType, ContextType>;
  awsSetupInfo?: Resolver<ResolversTypes['AwsSetupInfo'], ParentType, ContextType>;
  bedrockAvailableModels?: Resolver<Array<ResolversTypes['ModelInfo']>, ParentType, ContextType>;
  bedrockEnabledModels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  commandAllowlist?: Resolver<Array<ResolversTypes['AllowlistEntry']>, ParentType, ContextType, RequireFields<QueryCommandAllowlistArgs, 'agentId'>>;
  defaultImageModel?: Resolver<Maybe<ResolversTypes['DefaultModel']>, ParentType, ContextType>;
  defaultModel?: Resolver<Maybe<ResolversTypes['DefaultModel']>, ParentType, ContextType>;
  defaultSpeechModel?: Resolver<Maybe<ResolversTypes['DefaultModel']>, ParentType, ContextType>;
  documentSpeechUrls?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<QueryDocumentSpeechUrlsArgs, 'agentId' | 'text'>>;
  enabledModelDetails?: Resolver<Array<ResolversTypes['ModelInfo']>, ParentType, ContextType, RequireFields<QueryEnabledModelDetailsArgs, 'providerId'>>;
  enabledModels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<QueryEnabledModelsArgs, 'providerId'>>;
  file?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType, RequireFields<QueryFileArgs, 'path'>>;
  globalSettings?: Resolver<ResolversTypes['GlobalSettings'], ParentType, ContextType>;
  integrationConnections?: Resolver<Array<ResolversTypes['IntegrationConnection']>, ParentType, ContextType, Partial<QueryIntegrationConnectionsArgs>>;
  integrationProviders?: Resolver<Array<ResolversTypes['IntegrationProvider']>, ParentType, ContextType>;
  pendingCommandApprovals?: Resolver<Array<ResolversTypes['CommandApproval']>, ParentType, ContextType>;
  pendingInboxMessages?: Resolver<Array<ResolversTypes['PendingInboxMessage']>, ParentType, ContextType, RequireFields<QueryPendingInboxMessagesArgs, 'agentId'>>;
  profile?: Resolver<ResolversTypes['Profile'], ParentType, ContextType>;
  providerModels?: Resolver<Array<ResolversTypes['ProviderModelInfo']>, ParentType, ContextType, RequireFields<QueryProviderModelsArgs, 'providerId'>>;
  skillTemplate?: Resolver<Maybe<ResolversTypes['SkillTemplate']>, ParentType, ContextType, RequireFields<QuerySkillTemplateArgs, 'id'>>;
  skillTemplates?: Resolver<Array<ResolversTypes['SkillTemplate']>, ParentType, ContextType>;
  speechUrls?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<QuerySpeechUrlsArgs, 'logId'>>;
  speechVoices?: Resolver<Array<ResolversTypes['SpeechVoice']>, ParentType, ContextType, RequireFields<QuerySpeechVoicesArgs, 'providerId'>>;
  task?: Resolver<Maybe<ResolversTypes['Task']>, ParentType, ContextType, RequireFields<QueryTaskArgs, 'id'>>;
  taskLogs?: Resolver<ResolversTypes['AgentLogConnection'], ParentType, ContextType, RequireFields<QueryTaskLogsArgs, 'taskId'>>;
  tasks?: Resolver<ResolversTypes['TaskConnection'], ParentType, ContextType, Partial<QueryTasksArgs>>;
  userInputRequests?: Resolver<Array<ResolversTypes['UserInputRequest']>, ParentType, ContextType>;
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

export type SkillConnectionRequirementResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SkillConnectionRequirement'] = ResolversParentTypes['SkillConnectionRequirement']> = {
  multi?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  optional?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  providerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestedScopes?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
};

export type SkillConnectionStatusResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SkillConnectionStatus'] = ResolversParentTypes['SkillConnectionStatus']> = {
  boundConnectionIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  connected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  multi?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  optional?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  providerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SkillTemplateResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SkillTemplate'] = ResolversParentTypes['SkillTemplate']> = {
  allowedCommands?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  author?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  category?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  connections?: Resolver<Array<ResolversTypes['SkillConnectionRequirement']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasInstall?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  install?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  instructions?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SpeechAudioChunkResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SpeechAudioChunk'] = ResolversParentTypes['SpeechAudioChunk']> = {
  agentId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  done?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  logId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  sentenceIndex?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SpeechVoiceResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['SpeechVoice'] = ResolversParentTypes['SpeechVoice']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  previewUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  _empty?: SubscriptionResolver<Maybe<ResolversTypes['String']>, "_empty", ParentType, ContextType>;
  agentLogCreated?: SubscriptionResolver<ResolversTypes['AgentLog'], "agentLogCreated", ParentType, ContextType, RequireFields<SubscriptionAgentLogCreatedArgs, 'agentId'>>;
  agentStream?: SubscriptionResolver<ResolversTypes['AgentStreamDelta'], "agentStream", ParentType, ContextType, RequireFields<SubscriptionAgentStreamArgs, 'agentId'>>;
  agentUpdated?: SubscriptionResolver<ResolversTypes['Agent'], "agentUpdated", ParentType, ContextType, RequireFields<SubscriptionAgentUpdatedArgs, 'agentId'>>;
  agentsUpdated?: SubscriptionResolver<ResolversTypes['Agent'], "agentsUpdated", ParentType, ContextType, RequireFields<SubscriptionAgentsUpdatedArgs, 'agentIds'>>;
  jobCreated?: SubscriptionResolver<ResolversTypes['AgentJob'], "jobCreated", ParentType, ContextType>;
  jobTaskCreated?: SubscriptionResolver<ResolversTypes['Task'], "jobTaskCreated", ParentType, ContextType, RequireFields<SubscriptionJobTaskCreatedArgs, 'jobId'>>;
  logCreated?: SubscriptionResolver<ResolversTypes['AgentLog'], "logCreated", ParentType, ContextType, Partial<SubscriptionLogCreatedArgs>>;
  pendingItemsUpdated?: SubscriptionResolver<ResolversTypes['Boolean'], "pendingItemsUpdated", ParentType, ContextType>;
  sandboxOutput?: SubscriptionResolver<ResolversTypes['SandboxOutput'], "sandboxOutput", ParentType, ContextType, RequireFields<SubscriptionSandboxOutputArgs, 'taskId'>>;
  speechStream?: SubscriptionResolver<ResolversTypes['SpeechAudioChunk'], "speechStream", ParentType, ContextType, Partial<SubscriptionSpeechStreamArgs>>;
  taskLogCreated?: SubscriptionResolver<ResolversTypes['AgentLog'], "taskLogCreated", ParentType, ContextType, RequireFields<SubscriptionTaskLogCreatedArgs, 'taskId'>>;
  taskUpdated?: SubscriptionResolver<ResolversTypes['Task'], "taskUpdated", ParentType, ContextType, RequireFields<SubscriptionTaskUpdatedArgs, 'taskId'>>;
  tasksUpdated?: SubscriptionResolver<ResolversTypes['Task'], "tasksUpdated", ParentType, ContextType, RequireFields<SubscriptionTasksUpdatedArgs, 'taskIds'>>;
};

export type TaskResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Task'] = ResolversParentTypes['Task']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  attachments?: Resolver<Array<ResolversTypes['Attachment']>, ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  documents?: Resolver<Array<ResolversTypes['Document']>, ParentType, ContextType>;
  emoji?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  files?: Resolver<Array<ResolversTypes['File']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
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

export type ToolNameResolvers = EnumResolverSignature<{ attachFile?: any, attachLink?: any, authenticate?: any, backgroundTask?: any, delegate?: any, editFile?: any, ensureSandbox?: any, generateImage?: any, generateSpeech?: any, glob?: any, grep?: any, listFiles?: any, listJobs?: any, readCommandOutput?: any, readFile?: any, readSkill?: any, readSkillReference?: any, recallMemory?: any, replyToAssigner?: any, requestUserInput?: any, runCommand?: any, saveMemory?: any, scheduleJob?: any, updateJob?: any, updateTaskMessage?: any, viewImage?: any, webFetch?: any, webSearch?: any, writeFile?: any }, ResolversTypes['ToolName']>;

export type UnknownRenderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['UnknownRender'] = ResolversParentTypes['UnknownRender']> = {
  mimeType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserInputRequestResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['UserInputRequest'] = ResolversParentTypes['UserInputRequest']> = {
  actions?: Resolver<Array<ResolversTypes['UserInputRequestAction']>, ParentType, ContextType>;
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolvedAction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['UserInputRequestStatus'], ParentType, ContextType>;
  turnId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type UserInputRequestActionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['UserInputRequestAction'] = ResolversParentTypes['UserInputRequestAction']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  style?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type UserInputRequestStatusResolvers = EnumResolverSignature<{ DISMISSED?: any, PENDING?: any, RESOLVED?: any }, ResolversTypes['UserInputRequestStatus']>;

export type VideoRenderResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['VideoRender'] = ResolversParentTypes['VideoRender']> = {
  durationSeconds?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  thumbnailUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<VideoRenderThumbnailUrlArgs>>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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
  AgentImageGenerationConfig?: AgentImageGenerationConfigResolvers<ContextType>;
  AgentJob?: AgentJobResolvers<ContextType>;
  AgentLog?: AgentLogResolvers<ContextType>;
  AgentLogConnection?: AgentLogConnectionResolvers<ContextType>;
  AgentLogEdge?: AgentLogEdgeResolvers<ContextType>;
  AgentLogPageInfo?: AgentLogPageInfoResolvers<ContextType>;
  AgentManagerConfig?: AgentManagerConfigResolvers<ContextType>;
  AgentModelConfig?: AgentModelConfigResolvers<ContextType>;
  AgentReasoningConfig?: AgentReasoningConfigResolvers<ContextType>;
  AgentSandboxConfig?: AgentSandboxConfigResolvers<ContextType>;
  AgentSkill?: AgentSkillResolvers<ContextType>;
  AgentSpeechConfig?: AgentSpeechConfigResolvers<ContextType>;
  AgentStreamDelta?: AgentStreamDeltaResolvers<ContextType>;
  AgentViewImageConfig?: AgentViewImageConfigResolvers<ContextType>;
  AgentWebSearchConfig?: AgentWebSearchConfigResolvers<ContextType>;
  AllowlistEntry?: AllowlistEntryResolvers<ContextType>;
  ApiKeyConnectionMeta?: ApiKeyConnectionMetaResolvers<ContextType>;
  Attachment?: AttachmentResolvers<ContextType>;
  AudioRender?: AudioRenderResolvers<ContextType>;
  AvailableScope?: AvailableScopeResolvers<ContextType>;
  Avatar?: AvatarResolvers<ContextType>;
  AwsIamRoleConnectionMeta?: AwsIamRoleConnectionMetaResolvers<ContextType>;
  AwsPresetRole?: AwsPresetRoleResolvers<ContextType>;
  AwsSetupInfo?: AwsSetupInfoResolvers<ContextType>;
  CodeRender?: CodeRenderResolvers<ContextType>;
  CommandApproval?: CommandApprovalResolvers<ContextType>;
  CompletedFileUpload?: CompletedFileUploadResolvers<ContextType>;
  ConnectApiKeyResult?: ConnectApiKeyResultResolvers<ContextType>;
  ConnectionMeta?: ConnectionMetaResolvers<ContextType>;
  DefaultModel?: DefaultModelResolvers<ContextType>;
  Document?: DocumentResolvers<ContextType>;
  DocumentRender?: DocumentRenderResolvers<ContextType>;
  EnabledModelEntry?: EnabledModelEntryResolvers<ContextType>;
  File?: FileResolvers<ContextType>;
  FileAttachment?: FileAttachmentResolvers<ContextType>;
  FileRender?: FileRenderResolvers<ContextType>;
  FileUploadUrl?: FileUploadUrlResolvers<ContextType>;
  GlobalSettings?: GlobalSettingsResolvers<ContextType>;
  ImageRender?: ImageRenderResolvers<ContextType>;
  IntegrationConnection?: IntegrationConnectionResolvers<ContextType>;
  IntegrationProvider?: IntegrationProviderResolvers<ContextType>;
  LinkAttachment?: LinkAttachmentResolvers<ContextType>;
  ModelInfo?: ModelInfoResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  OAuthConnectionMeta?: OAuthConnectionMetaResolvers<ContextType>;
  OAuthPlatformOverride?: OAuthPlatformOverrideResolvers<ContextType>;
  PendingInboxMessage?: PendingInboxMessageResolvers<ContextType>;
  Profile?: ProfileResolvers<ContextType>;
  ProviderModelInfo?: ProviderModelInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SandboxOutput?: SandboxOutputResolvers<ContextType>;
  SendMessageResult?: SendMessageResultResolvers<ContextType>;
  SkillConnectionRequirement?: SkillConnectionRequirementResolvers<ContextType>;
  SkillConnectionStatus?: SkillConnectionStatusResolvers<ContextType>;
  SkillTemplate?: SkillTemplateResolvers<ContextType>;
  SpeechAudioChunk?: SpeechAudioChunkResolvers<ContextType>;
  SpeechVoice?: SpeechVoiceResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Task?: TaskResolvers<ContextType>;
  TaskConnection?: TaskConnectionResolvers<ContextType>;
  TaskEdge?: TaskEdgeResolvers<ContextType>;
  TaskPageInfo?: TaskPageInfoResolvers<ContextType>;
  ToolName?: ToolNameResolvers;
  UnknownRender?: UnknownRenderResolvers<ContextType>;
  UserInputRequest?: UserInputRequestResolvers<ContextType>;
  UserInputRequestAction?: UserInputRequestActionResolvers<ContextType>;
  UserInputRequestStatus?: UserInputRequestStatusResolvers;
  VideoRender?: VideoRenderResolvers<ContextType>;
  WorkspaceEntry?: WorkspaceEntryResolvers<ContextType>;
};

