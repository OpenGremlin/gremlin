import { GraphQLResolveInfo } from 'graphql';
import { AgentItem } from '../resources/ddb/schema/agent.js';
import { AgentJobItem } from '../resources/ddb/schema/agentJob.js';
import { AgentLogItem } from '../resources/ddb/schema/agentLog.js';
import { AgentLogConnectionModel, AgentLogEdgeModel, PageInfoModel } from '../services/agentLogs/pagination.js';
import { DocumentItem } from '../resources/ddb/schema/document.js';
import { AvatarModel } from './schema/Avatar/resolvers.js';
import { IntegrationItem } from '../resources/ddb/schema/integration.js';
import { NotificationItem } from '../resources/ddb/schema/notification.js';
import { ProfileItem } from '../resources/ddb/schema/profile.js';
import { SkillItem } from '../resources/ddb/schema/skill.js';
import { TaskItem } from '../resources/ddb/schema/task.js';
import { TaskConnectionModel, TaskEdgeModel, TaskPageInfoModel } from '../services/tasks/pagination.js';
import { TaskFollowUpItem } from '../resources/ddb/schema/taskFollowUp.js';
import { GremlinContext } from './context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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
};

export type AgentLog = {
  __typename?: 'AgentLog';
  agent: Agent;
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  role: AgentLogRole;
  taskId?: Maybe<Scalars['String']['output']>;
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

export enum AuthMethod {
  ApiKey = 'API_KEY',
  Oauth = 'OAUTH',
  Token = 'TOKEN'
}

export type Avatar = {
  __typename?: 'Avatar';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  url: Scalars['String']['output'];
};


export type AvatarUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type Document = {
  __typename?: 'Document';
  body: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type Integration = {
  __typename?: 'Integration';
  account: Scalars['String']['output'];
  authMethod: AuthMethod;
  connectedAt: Scalars['String']['output'];
  description: Scalars['String']['output'];
  icon: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  permissions: Array<Permission>;
  service: Scalars['String']['output'];
};

export enum JobStatus {
  Error = 'ERROR',
  Idle = 'IDLE',
  Paused = 'PAUSED',
  Running = 'RUNNING'
}

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  dismissNotification?: Maybe<Notification>;
  installSkill?: Maybe<Skill>;
  resolveNotification?: Maybe<Notification>;
  sendMessage: AgentLog;
  togglePermission?: Maybe<Integration>;
  uninstallSkill?: Maybe<Skill>;
  updateAgentJob?: Maybe<AgentJob>;
  updateAgentStatus?: Maybe<Agent>;
  updateJobStatus?: Maybe<AgentJob>;
  updateProfile: Profile;
};


export type MutationDismissNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationInstallSkillArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResolveNotificationArgs = {
  actionId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationSendMessageArgs = {
  agentId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  taskId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTogglePermissionArgs = {
  enabled: Scalars['Boolean']['input'];
  integrationId: Scalars['ID']['input'];
  scope: Scalars['String']['input'];
};


export type MutationUninstallSkillArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAgentJobArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAgentJobInput;
};


export type MutationUpdateAgentStatusArgs = {
  id: Scalars['ID']['input'];
  status: AgentStatus;
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

export type Permission = {
  __typename?: 'Permission';
  enabled: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  scope: Scalars['String']['output'];
};

export type Profile = {
  __typename?: 'Profile';
  about: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  website?: Maybe<Scalars['String']['output']>;
};

export type ProfileInput = {
  about: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
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
  document?: Maybe<Document>;
  integration?: Maybe<Integration>;
  integrations: Array<Integration>;
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


export type QueryIntegrationArgs = {
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
};


export type SubscriptionAgentLogCreatedArgs = {
  agentId: Scalars['ID']['input'];
};

export type Task = {
  __typename?: 'Task';
  agent: Agent;
  completedAt?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  logs: AgentLogConnection;
  originJobId?: Maybe<Scalars['String']['output']>;
  status: TaskStatus;
  statusReason?: Maybe<Scalars['String']['output']>;
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

export type UpdateAgentJobInput = {
  agentId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  recurrence?: InputMaybe<Scalars['String']['input']>;
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





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Agent: ResolverTypeWrapper<AgentItem>;
  AgentJob: ResolverTypeWrapper<AgentJobItem>;
  AgentLog: ResolverTypeWrapper<AgentLogItem>;
  AgentLogConnection: ResolverTypeWrapper<AgentLogConnectionModel>;
  AgentLogEdge: ResolverTypeWrapper<AgentLogEdgeModel>;
  AgentLogPageInfo: ResolverTypeWrapper<PageInfoModel>;
  AgentLogRole: AgentLogRole;
  AgentStatus: AgentStatus;
  AuthMethod: AuthMethod;
  Avatar: ResolverTypeWrapper<AvatarModel>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Document: ResolverTypeWrapper<DocumentItem>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Integration: ResolverTypeWrapper<IntegrationItem>;
  JobStatus: JobStatus;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Notification: ResolverTypeWrapper<NotificationItem>;
  NotificationAction: ResolverTypeWrapper<NotificationAction>;
  NotificationStatus: NotificationStatus;
  NotificationType: NotificationType;
  Permission: ResolverTypeWrapper<Permission>;
  Profile: ResolverTypeWrapper<ProfileItem>;
  ProfileInput: ProfileInput;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Skill: ResolverTypeWrapper<SkillItem>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Task: ResolverTypeWrapper<TaskItem>;
  TaskConnection: ResolverTypeWrapper<TaskConnectionModel>;
  TaskEdge: ResolverTypeWrapper<TaskEdgeModel>;
  TaskFollowUp: ResolverTypeWrapper<TaskFollowUpItem>;
  TaskPageInfo: ResolverTypeWrapper<TaskPageInfoModel>;
  TaskStatus: TaskStatus;
  UpdateAgentJobInput: UpdateAgentJobInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Agent: AgentItem;
  AgentJob: AgentJobItem;
  AgentLog: AgentLogItem;
  AgentLogConnection: AgentLogConnectionModel;
  AgentLogEdge: AgentLogEdgeModel;
  AgentLogPageInfo: PageInfoModel;
  Avatar: AvatarModel;
  Boolean: Scalars['Boolean']['output'];
  Document: DocumentItem;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Integration: IntegrationItem;
  Mutation: Record<PropertyKey, never>;
  Notification: NotificationItem;
  NotificationAction: NotificationAction;
  Permission: Permission;
  Profile: ProfileItem;
  ProfileInput: ProfileInput;
  Query: Record<PropertyKey, never>;
  Skill: SkillItem;
  String: Scalars['String']['output'];
  Subscription: Record<PropertyKey, never>;
  Task: TaskItem;
  TaskConnection: TaskConnectionModel;
  TaskEdge: TaskEdgeModel;
  TaskFollowUp: TaskFollowUpItem;
  TaskPageInfo: TaskPageInfoModel;
  UpdateAgentJobInput: UpdateAgentJobInput;
};

export type AgentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Agent'] = ResolversParentTypes['Agent']> = {
  avatar?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<AgentImageUrlArgs>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  portraitId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  soul?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AgentStatus'], ParentType, ContextType>;
  statusReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
};

export type AgentLogResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['AgentLog'] = ResolversParentTypes['AgentLog']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['AgentLogRole'], ParentType, ContextType>;
  taskId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type AvatarResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Avatar'] = ResolversParentTypes['Avatar']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<AvatarUrlArgs>>;
};

export type DocumentResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Document'] = ResolversParentTypes['Document']> = {
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type IntegrationResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Integration'] = ResolversParentTypes['Integration']> = {
  account?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  authMethod?: Resolver<ResolversTypes['AuthMethod'], ParentType, ContextType>;
  connectedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['Permission']>, ParentType, ContextType>;
  service?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dismissNotification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<MutationDismissNotificationArgs, 'id'>>;
  installSkill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationInstallSkillArgs, 'id'>>;
  resolveNotification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<MutationResolveNotificationArgs, 'actionId' | 'id'>>;
  sendMessage?: Resolver<ResolversTypes['AgentLog'], ParentType, ContextType, RequireFields<MutationSendMessageArgs, 'agentId' | 'content'>>;
  togglePermission?: Resolver<Maybe<ResolversTypes['Integration']>, ParentType, ContextType, RequireFields<MutationTogglePermissionArgs, 'enabled' | 'integrationId' | 'scope'>>;
  uninstallSkill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationUninstallSkillArgs, 'id'>>;
  updateAgentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<MutationUpdateAgentJobArgs, 'id' | 'input'>>;
  updateAgentStatus?: Resolver<Maybe<ResolversTypes['Agent']>, ParentType, ContextType, RequireFields<MutationUpdateAgentStatusArgs, 'id' | 'status'>>;
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

export type PermissionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Permission'] = ResolversParentTypes['Permission']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scope?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ProfileResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Profile'] = ResolversParentTypes['Profile']> = {
  about?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  website?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  activeFollowUps?: Resolver<Array<ResolversTypes['TaskFollowUp']>, ParentType, ContextType>;
  agent?: Resolver<Maybe<ResolversTypes['Agent']>, ParentType, ContextType, RequireFields<QueryAgentArgs, 'id'>>;
  agentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<QueryAgentJobArgs, 'id'>>;
  agentJobs?: Resolver<Array<ResolversTypes['AgentJob']>, ParentType, ContextType>;
  agentLogs?: Resolver<ResolversTypes['AgentLogConnection'], ParentType, ContextType, RequireFields<QueryAgentLogsArgs, 'agentId'>>;
  agents?: Resolver<Array<ResolversTypes['Agent']>, ParentType, ContextType>;
  avatars?: Resolver<Array<ResolversTypes['Avatar']>, ParentType, ContextType>;
  document?: Resolver<Maybe<ResolversTypes['Document']>, ParentType, ContextType, RequireFields<QueryDocumentArgs, 'id'>>;
  integration?: Resolver<Maybe<ResolversTypes['Integration']>, ParentType, ContextType, RequireFields<QueryIntegrationArgs, 'id'>>;
  integrations?: Resolver<Array<ResolversTypes['Integration']>, ParentType, ContextType>;
  notifications?: Resolver<Array<ResolversTypes['Notification']>, ParentType, ContextType>;
  profile?: Resolver<ResolversTypes['Profile'], ParentType, ContextType>;
  searchSkills?: Resolver<Array<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<QuerySearchSkillsArgs, 'query'>>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<QuerySkillArgs, 'id'>>;
  skills?: Resolver<Array<ResolversTypes['Skill']>, ParentType, ContextType>;
  task?: Resolver<Maybe<ResolversTypes['Task']>, ParentType, ContextType, RequireFields<QueryTaskArgs, 'id'>>;
  taskFollowUps?: Resolver<Array<ResolversTypes['TaskFollowUp']>, ParentType, ContextType, RequireFields<QueryTaskFollowUpsArgs, 'taskId'>>;
  taskLogs?: Resolver<ResolversTypes['AgentLogConnection'], ParentType, ContextType, RequireFields<QueryTaskLogsArgs, 'taskId'>>;
  tasks?: Resolver<ResolversTypes['TaskConnection'], ParentType, ContextType, Partial<QueryTasksArgs>>;
};

export type SkillResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Skill'] = ResolversParentTypes['Skill']> = {
  author?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  homepage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  installed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requiredEnv?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  _empty?: SubscriptionResolver<Maybe<ResolversTypes['String']>, "_empty", ParentType, ContextType>;
  agentLogCreated?: SubscriptionResolver<ResolversTypes['AgentLog'], "agentLogCreated", ParentType, ContextType, RequireFields<SubscriptionAgentLogCreatedArgs, 'agentId'>>;
};

export type TaskResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['Task'] = ResolversParentTypes['Task']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logs?: Resolver<ResolversTypes['AgentLogConnection'], ParentType, ContextType, Partial<TaskLogsArgs>>;
  originJobId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TaskStatus'], ParentType, ContextType>;
  statusReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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

export type TaskFollowUpResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['TaskFollowUp'] = ResolversParentTypes['TaskFollowUp']> = {
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  prompt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scheduledAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  task?: Resolver<ResolversTypes['Task'], ParentType, ContextType>;
};

export type TaskPageInfoResolvers<ContextType = GremlinContext, ParentType extends ResolversParentTypes['TaskPageInfo'] = ResolversParentTypes['TaskPageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = GremlinContext> = {
  Agent?: AgentResolvers<ContextType>;
  AgentJob?: AgentJobResolvers<ContextType>;
  AgentLog?: AgentLogResolvers<ContextType>;
  AgentLogConnection?: AgentLogConnectionResolvers<ContextType>;
  AgentLogEdge?: AgentLogEdgeResolvers<ContextType>;
  AgentLogPageInfo?: AgentLogPageInfoResolvers<ContextType>;
  Avatar?: AvatarResolvers<ContextType>;
  Document?: DocumentResolvers<ContextType>;
  Integration?: IntegrationResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  NotificationAction?: NotificationActionResolvers<ContextType>;
  Permission?: PermissionResolvers<ContextType>;
  Profile?: ProfileResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Skill?: SkillResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Task?: TaskResolvers<ContextType>;
  TaskConnection?: TaskConnectionResolvers<ContextType>;
  TaskEdge?: TaskEdgeResolvers<ContextType>;
  TaskFollowUp?: TaskFollowUpResolvers<ContextType>;
  TaskPageInfo?: TaskPageInfoResolvers<ContextType>;
};

