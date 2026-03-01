import { GraphQLResolveInfo } from 'graphql';
import { AgentModel } from './schema/Agent/resolvers.js';
import { FeedItemModel } from './schema/Feed/resolvers.js';
import { Context } from './context.js';
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
};


export type AgentImageUrlArgs = {
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type AgentJob = {
  __typename?: 'AgentJob';
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastRun?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nextRun?: Maybe<Scalars['String']['output']>;
  recurrence: Scalars['String']['output'];
  status: JobStatus;
};

export enum AgentStatus {
  Active = 'ACTIVE',
  Scheduled = 'SCHEDULED',
  Idle = 'IDLE'
}

export enum AuthMethod {
  ApiKey = 'API_KEY',
  Oauth = 'OAUTH',
  Token = 'TOKEN'
}

export enum FeedCategory {
  Monitor = 'MONITOR',
  Report = 'REPORT',
  Research = 'RESEARCH',
  Task = 'TASK'
}

export type FeedItem = {
  __typename?: 'FeedItem';
  agent: Agent;
  body: Scalars['String']['output'];
  category: FeedCategory;
  completedAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  summary: Scalars['String']['output'];
  title: Scalars['String']['output'];
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
  installSkill?: Maybe<Skill>;
  togglePermission?: Maybe<Integration>;
  uninstallSkill?: Maybe<Skill>;
  updateAgentStatus?: Maybe<Agent>;
  updateJobStatus?: Maybe<AgentJob>;
};


export type MutationInstallSkillArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTogglePermissionArgs = {
  enabled: Scalars['Boolean']['input'];
  integrationId: Scalars['ID']['input'];
  scope: Scalars['String']['input'];
};


export type MutationUninstallSkillArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAgentStatusArgs = {
  id: Scalars['ID']['input'];
  status: AgentStatus;
};


export type MutationUpdateJobStatusArgs = {
  id: Scalars['ID']['input'];
  status: JobStatus;
};

export type Permission = {
  __typename?: 'Permission';
  enabled: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  scope: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  agent?: Maybe<Agent>;
  agentJob?: Maybe<AgentJob>;
  agentJobs: Array<AgentJob>;
  agents: Array<Agent>;
  feedItem?: Maybe<FeedItem>;
  feedItems: Array<FeedItem>;
  integration?: Maybe<Integration>;
  integrations: Array<Integration>;
  searchSkills: Array<Skill>;
  skill?: Maybe<Skill>;
  skills: Array<Skill>;
};


export type QueryAgentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAgentJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFeedItemArgs = {
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
  Agent: ResolverTypeWrapper<AgentModel>;
  AgentJob: ResolverTypeWrapper<AgentJob>;
  AgentStatus: AgentStatus;
  AuthMethod: AuthMethod;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  FeedCategory: FeedCategory;
  FeedItem: ResolverTypeWrapper<FeedItemModel>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Integration: ResolverTypeWrapper<Integration>;
  JobStatus: JobStatus;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Permission: ResolverTypeWrapper<Permission>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Skill: ResolverTypeWrapper<Skill>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Agent: AgentModel;
  AgentJob: AgentJob;
  Boolean: Scalars['Boolean']['output'];
  FeedItem: FeedItemModel;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Integration: Integration;
  Mutation: Record<PropertyKey, never>;
  Permission: Permission;
  Query: Record<PropertyKey, never>;
  Skill: Skill;
  String: Scalars['String']['output'];
};

export type AgentResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Agent'] = ResolversParentTypes['Agent']> = {
  avatar?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imageUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<AgentImageUrlArgs>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  portraitId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  soul?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['AgentStatus'], ParentType, ContextType>;
};

export type AgentJobResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AgentJob'] = ResolversParentTypes['AgentJob']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastRun?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nextRun?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  recurrence?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['JobStatus'], ParentType, ContextType>;
};

export type FeedItemResolvers<ContextType = Context, ParentType extends ResolversParentTypes['FeedItem'] = ResolversParentTypes['FeedItem']> = {
  agent?: Resolver<ResolversTypes['Agent'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['FeedCategory'], ParentType, ContextType>;
  completedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type IntegrationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Integration'] = ResolversParentTypes['Integration']> = {
  account?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  authMethod?: Resolver<ResolversTypes['AuthMethod'], ParentType, ContextType>;
  connectedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['Permission']>, ParentType, ContextType>;
  service?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  installSkill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationInstallSkillArgs, 'id'>>;
  togglePermission?: Resolver<Maybe<ResolversTypes['Integration']>, ParentType, ContextType, RequireFields<MutationTogglePermissionArgs, 'enabled' | 'integrationId' | 'scope'>>;
  uninstallSkill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<MutationUninstallSkillArgs, 'id'>>;
  updateAgentStatus?: Resolver<Maybe<ResolversTypes['Agent']>, ParentType, ContextType, RequireFields<MutationUpdateAgentStatusArgs, 'id' | 'status'>>;
  updateJobStatus?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<MutationUpdateJobStatusArgs, 'id' | 'status'>>;
};

export type PermissionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Permission'] = ResolversParentTypes['Permission']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scope?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  agent?: Resolver<Maybe<ResolversTypes['Agent']>, ParentType, ContextType, RequireFields<QueryAgentArgs, 'id'>>;
  agentJob?: Resolver<Maybe<ResolversTypes['AgentJob']>, ParentType, ContextType, RequireFields<QueryAgentJobArgs, 'id'>>;
  agentJobs?: Resolver<Array<ResolversTypes['AgentJob']>, ParentType, ContextType>;
  agents?: Resolver<Array<ResolversTypes['Agent']>, ParentType, ContextType>;
  feedItem?: Resolver<Maybe<ResolversTypes['FeedItem']>, ParentType, ContextType, RequireFields<QueryFeedItemArgs, 'id'>>;
  feedItems?: Resolver<Array<ResolversTypes['FeedItem']>, ParentType, ContextType>;
  integration?: Resolver<Maybe<ResolversTypes['Integration']>, ParentType, ContextType, RequireFields<QueryIntegrationArgs, 'id'>>;
  integrations?: Resolver<Array<ResolversTypes['Integration']>, ParentType, ContextType>;
  searchSkills?: Resolver<Array<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<QuerySearchSkillsArgs, 'query'>>;
  skill?: Resolver<Maybe<ResolversTypes['Skill']>, ParentType, ContextType, RequireFields<QuerySkillArgs, 'id'>>;
  skills?: Resolver<Array<ResolversTypes['Skill']>, ParentType, ContextType>;
};

export type SkillResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Skill'] = ResolversParentTypes['Skill']> = {
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

export type Resolvers<ContextType = Context> = {
  Agent?: AgentResolvers<ContextType>;
  AgentJob?: AgentJobResolvers<ContextType>;
  FeedItem?: FeedItemResolvers<ContextType>;
  Integration?: IntegrationResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Permission?: PermissionResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Skill?: SkillResolvers<ContextType>;
};

