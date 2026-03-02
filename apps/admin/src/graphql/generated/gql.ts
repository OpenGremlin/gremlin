/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": typeof types.AgentLogsDocument,
    "\n  mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {\n    sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n": typeof types.SendMessageDocument,
    "\n  subscription AgentLogCreated($agentId: ID!) {\n    agentLogCreated(agentId: $agentId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n": typeof types.AgentLogCreatedDocument,
    "\n  query Agents {\n    agents {\n      id\n      name\n      soul\n      statusReason\n    }\n  }\n": typeof types.AgentsDocument,
    "\n  query Agent($id: ID!) {\n    agent(id: $id) {\n      id\n      name\n      avatar\n      portraitId\n      imageUrl(width: 100)\n      soul\n      status\n      statusReason\n    }\n  }\n": typeof types.AgentDocument,
    "\n  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {\n    updateAgent(id: $id, input: $input) {\n      id\n      name\n      avatar\n      soul\n    }\n  }\n": typeof types.UpdateAgentDocument,
    "\n  subscription AgentUpdated($agentId: ID!) {\n    agentUpdated(agentId: $agentId) {\n      id\n      status\n      statusReason\n    }\n  }\n": typeof types.AgentUpdatedDocument,
    "\n  query Document($id: ID!) {\n    document(id: $id) {\n      id\n      title\n      body\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.DocumentDocument,
    "\n  subscription DocumentUpdated($id: ID!) {\n    documentUpdated(id: $id) {\n      id\n      title\n      body\n      updatedAt\n    }\n  }\n": typeof types.DocumentUpdatedDocument,
    "\n  query Integrations {\n    integrations {\n      id\n      service\n      icon\n      account\n    }\n  }\n": typeof types.IntegrationsDocument,
    "\n  query Integration($id: ID!) {\n    integration(id: $id) {\n      id\n      service\n      icon\n      description\n      account\n      connectedAt\n      authMethod\n      permissions {\n        scope\n        label\n        enabled\n      }\n    }\n  }\n": typeof types.IntegrationDocument,
    "\n  mutation ConnectGoogle {\n    connectGoogle\n  }\n": typeof types.ConnectGoogleDocument,
    "\n  mutation TogglePermission($integrationId: ID!, $scope: String!, $enabled: Boolean!) {\n    togglePermission(integrationId: $integrationId, scope: $scope, enabled: $enabled) {\n      id\n      service\n      icon\n      description\n      account\n      connectedAt\n      authMethod\n      permissions {\n        scope\n        label\n        enabled\n      }\n    }\n  }\n": typeof types.TogglePermissionDocument,
    "\n  query AgentJobs {\n    agentJobs {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n      }\n      status\n      lastRun\n      nextRun\n    }\n  }\n": typeof types.AgentJobsDocument,
    "\n  query AgentJob($id: ID!) {\n    agentJob(id: $id) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n        name\n      }\n      status\n      lastRun\n      nextRun\n      tasks {\n        id\n        agent {\n          id\n        }\n        title\n        status\n        createdAt\n      }\n    }\n  }\n": typeof types.AgentJobDocument,
    "\n  mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {\n    updateAgentJob(id: $id, input: $input) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n      }\n      status\n      lastRun\n      nextRun\n    }\n  }\n": typeof types.UpdateAgentJobDocument,
    "\n  query Notifications {\n    notifications {\n      id\n      agent {\n        id\n        name\n      }\n      type\n      turnId\n      message\n      actions {\n        id\n        label\n        style\n      }\n      status\n      resolvedAction\n      createdAt\n    }\n  }\n": typeof types.NotificationsDocument,
    "\n  mutation ResolveNotification($id: ID!, $actionId: String!) {\n    resolveNotification(id: $id, actionId: $actionId) {\n      id\n      status\n      resolvedAction\n    }\n  }\n": typeof types.ResolveNotificationDocument,
    "\n  mutation DismissNotification($id: ID!) {\n    dismissNotification(id: $id) {\n      id\n      status\n    }\n  }\n": typeof types.DismissNotificationDocument,
    "\n  query Profile {\n    profile {\n      displayName\n      about\n      website\n    }\n  }\n": typeof types.ProfileDocument,
    "\n  mutation UpdateProfile($input: ProfileInput!) {\n    updateProfile(input: $input) {\n      displayName\n      about\n      website\n    }\n  }\n": typeof types.UpdateProfileDocument,
    "\n  query Avatars {\n    avatars {\n      id\n      name\n      url(width: 200)\n    }\n  }\n": typeof types.AvatarsDocument,
    "\n  query Skills {\n    skills {\n      id\n      name\n      description\n      version\n      installed\n    }\n  }\n": typeof types.SkillsDocument,
    "\n  query Skill($id: ID!) {\n    skill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n": typeof types.SkillDocument,
    "\n  mutation InstallSkill($id: ID!) {\n    installSkill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n": typeof types.InstallSkillDocument,
    "\n  mutation UninstallSkill($id: ID!) {\n    uninstallSkill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n": typeof types.UninstallSkillDocument,
    "\n  query Tasks($first: Int, $after: String, $last: Int, $before: String) {\n    tasks(first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          agent {\n            id\n            name\n          }\n          title\n          status\n          message\n          createdAt\n          documents {\n            id\n            title\n            body\n            createdAt\n            updatedAt\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": typeof types.TasksDocument,
    "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      agent {\n        id\n      }\n      title\n      status\n      message\n      createdAt\n      updatedAt\n      completedAt\n      artifacts\n      documents {\n        id\n        title\n        body\n        createdAt\n        updatedAt\n      }\n      logs(last: 50) {\n        edges {\n          node {\n            id\n            role\n            content\n            toolName\n            toolInput\n            toolResult\n            taskId\n            createdAt\n          }\n        }\n        pageInfo {\n          hasNextPage\n          hasPreviousPage\n          startCursor\n          endCursor\n        }\n      }\n    }\n  }\n": typeof types.TaskDocument,
    "\n  subscription TaskLogCreated($taskId: ID!) {\n    taskLogCreated(taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n": typeof types.TaskLogCreatedDocument,
    "\n  subscription TaskUpdated($taskId: ID!) {\n    taskUpdated(taskId: $taskId) {\n      id\n      title\n      status\n      message\n      updatedAt\n      completedAt\n      artifacts\n      documents {\n        id\n        title\n        body\n        updatedAt\n      }\n    }\n  }\n": typeof types.TaskUpdatedDocument,
};
const documents: Documents = {
    "\n  query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": types.AgentLogsDocument,
    "\n  mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {\n    sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n": types.SendMessageDocument,
    "\n  subscription AgentLogCreated($agentId: ID!) {\n    agentLogCreated(agentId: $agentId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n": types.AgentLogCreatedDocument,
    "\n  query Agents {\n    agents {\n      id\n      name\n      soul\n      statusReason\n    }\n  }\n": types.AgentsDocument,
    "\n  query Agent($id: ID!) {\n    agent(id: $id) {\n      id\n      name\n      avatar\n      portraitId\n      imageUrl(width: 100)\n      soul\n      status\n      statusReason\n    }\n  }\n": types.AgentDocument,
    "\n  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {\n    updateAgent(id: $id, input: $input) {\n      id\n      name\n      avatar\n      soul\n    }\n  }\n": types.UpdateAgentDocument,
    "\n  subscription AgentUpdated($agentId: ID!) {\n    agentUpdated(agentId: $agentId) {\n      id\n      status\n      statusReason\n    }\n  }\n": types.AgentUpdatedDocument,
    "\n  query Document($id: ID!) {\n    document(id: $id) {\n      id\n      title\n      body\n      createdAt\n      updatedAt\n    }\n  }\n": types.DocumentDocument,
    "\n  subscription DocumentUpdated($id: ID!) {\n    documentUpdated(id: $id) {\n      id\n      title\n      body\n      updatedAt\n    }\n  }\n": types.DocumentUpdatedDocument,
    "\n  query Integrations {\n    integrations {\n      id\n      service\n      icon\n      account\n    }\n  }\n": types.IntegrationsDocument,
    "\n  query Integration($id: ID!) {\n    integration(id: $id) {\n      id\n      service\n      icon\n      description\n      account\n      connectedAt\n      authMethod\n      permissions {\n        scope\n        label\n        enabled\n      }\n    }\n  }\n": types.IntegrationDocument,
    "\n  mutation ConnectGoogle {\n    connectGoogle\n  }\n": types.ConnectGoogleDocument,
    "\n  mutation TogglePermission($integrationId: ID!, $scope: String!, $enabled: Boolean!) {\n    togglePermission(integrationId: $integrationId, scope: $scope, enabled: $enabled) {\n      id\n      service\n      icon\n      description\n      account\n      connectedAt\n      authMethod\n      permissions {\n        scope\n        label\n        enabled\n      }\n    }\n  }\n": types.TogglePermissionDocument,
    "\n  query AgentJobs {\n    agentJobs {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n      }\n      status\n      lastRun\n      nextRun\n    }\n  }\n": types.AgentJobsDocument,
    "\n  query AgentJob($id: ID!) {\n    agentJob(id: $id) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n        name\n      }\n      status\n      lastRun\n      nextRun\n      tasks {\n        id\n        agent {\n          id\n        }\n        title\n        status\n        createdAt\n      }\n    }\n  }\n": types.AgentJobDocument,
    "\n  mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {\n    updateAgentJob(id: $id, input: $input) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n      }\n      status\n      lastRun\n      nextRun\n    }\n  }\n": types.UpdateAgentJobDocument,
    "\n  query Notifications {\n    notifications {\n      id\n      agent {\n        id\n        name\n      }\n      type\n      turnId\n      message\n      actions {\n        id\n        label\n        style\n      }\n      status\n      resolvedAction\n      createdAt\n    }\n  }\n": types.NotificationsDocument,
    "\n  mutation ResolveNotification($id: ID!, $actionId: String!) {\n    resolveNotification(id: $id, actionId: $actionId) {\n      id\n      status\n      resolvedAction\n    }\n  }\n": types.ResolveNotificationDocument,
    "\n  mutation DismissNotification($id: ID!) {\n    dismissNotification(id: $id) {\n      id\n      status\n    }\n  }\n": types.DismissNotificationDocument,
    "\n  query Profile {\n    profile {\n      displayName\n      about\n      website\n    }\n  }\n": types.ProfileDocument,
    "\n  mutation UpdateProfile($input: ProfileInput!) {\n    updateProfile(input: $input) {\n      displayName\n      about\n      website\n    }\n  }\n": types.UpdateProfileDocument,
    "\n  query Avatars {\n    avatars {\n      id\n      name\n      url(width: 200)\n    }\n  }\n": types.AvatarsDocument,
    "\n  query Skills {\n    skills {\n      id\n      name\n      description\n      version\n      installed\n    }\n  }\n": types.SkillsDocument,
    "\n  query Skill($id: ID!) {\n    skill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n": types.SkillDocument,
    "\n  mutation InstallSkill($id: ID!) {\n    installSkill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n": types.InstallSkillDocument,
    "\n  mutation UninstallSkill($id: ID!) {\n    uninstallSkill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n": types.UninstallSkillDocument,
    "\n  query Tasks($first: Int, $after: String, $last: Int, $before: String) {\n    tasks(first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          agent {\n            id\n            name\n          }\n          title\n          status\n          message\n          createdAt\n          documents {\n            id\n            title\n            body\n            createdAt\n            updatedAt\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": types.TasksDocument,
    "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      agent {\n        id\n      }\n      title\n      status\n      message\n      createdAt\n      updatedAt\n      completedAt\n      artifacts\n      documents {\n        id\n        title\n        body\n        createdAt\n        updatedAt\n      }\n      logs(last: 50) {\n        edges {\n          node {\n            id\n            role\n            content\n            toolName\n            toolInput\n            toolResult\n            taskId\n            createdAt\n          }\n        }\n        pageInfo {\n          hasNextPage\n          hasPreviousPage\n          startCursor\n          endCursor\n        }\n      }\n    }\n  }\n": types.TaskDocument,
    "\n  subscription TaskLogCreated($taskId: ID!) {\n    taskLogCreated(taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n": types.TaskLogCreatedDocument,
    "\n  subscription TaskUpdated($taskId: ID!) {\n    taskUpdated(taskId: $taskId) {\n      id\n      title\n      status\n      message\n      updatedAt\n      completedAt\n      artifacts\n      documents {\n        id\n        title\n        body\n        updatedAt\n      }\n    }\n  }\n": types.TaskUpdatedDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n"): typeof import('./graphql').AgentLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {\n    sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n"): typeof import('./graphql').SendMessageDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription AgentLogCreated($agentId: ID!) {\n    agentLogCreated(agentId: $agentId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n"): typeof import('./graphql').AgentLogCreatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Agents {\n    agents {\n      id\n      name\n      soul\n      statusReason\n    }\n  }\n"): typeof import('./graphql').AgentsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Agent($id: ID!) {\n    agent(id: $id) {\n      id\n      name\n      avatar\n      portraitId\n      imageUrl(width: 100)\n      soul\n      status\n      statusReason\n    }\n  }\n"): typeof import('./graphql').AgentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {\n    updateAgent(id: $id, input: $input) {\n      id\n      name\n      avatar\n      soul\n    }\n  }\n"): typeof import('./graphql').UpdateAgentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription AgentUpdated($agentId: ID!) {\n    agentUpdated(agentId: $agentId) {\n      id\n      status\n      statusReason\n    }\n  }\n"): typeof import('./graphql').AgentUpdatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Document($id: ID!) {\n    document(id: $id) {\n      id\n      title\n      body\n      createdAt\n      updatedAt\n    }\n  }\n"): typeof import('./graphql').DocumentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription DocumentUpdated($id: ID!) {\n    documentUpdated(id: $id) {\n      id\n      title\n      body\n      updatedAt\n    }\n  }\n"): typeof import('./graphql').DocumentUpdatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Integrations {\n    integrations {\n      id\n      service\n      icon\n      account\n    }\n  }\n"): typeof import('./graphql').IntegrationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Integration($id: ID!) {\n    integration(id: $id) {\n      id\n      service\n      icon\n      description\n      account\n      connectedAt\n      authMethod\n      permissions {\n        scope\n        label\n        enabled\n      }\n    }\n  }\n"): typeof import('./graphql').IntegrationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConnectGoogle {\n    connectGoogle\n  }\n"): typeof import('./graphql').ConnectGoogleDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TogglePermission($integrationId: ID!, $scope: String!, $enabled: Boolean!) {\n    togglePermission(integrationId: $integrationId, scope: $scope, enabled: $enabled) {\n      id\n      service\n      icon\n      description\n      account\n      connectedAt\n      authMethod\n      permissions {\n        scope\n        label\n        enabled\n      }\n    }\n  }\n"): typeof import('./graphql').TogglePermissionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AgentJobs {\n    agentJobs {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n      }\n      status\n      lastRun\n      nextRun\n    }\n  }\n"): typeof import('./graphql').AgentJobsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AgentJob($id: ID!) {\n    agentJob(id: $id) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n        name\n      }\n      status\n      lastRun\n      nextRun\n      tasks {\n        id\n        agent {\n          id\n        }\n        title\n        status\n        createdAt\n      }\n    }\n  }\n"): typeof import('./graphql').AgentJobDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {\n    updateAgentJob(id: $id, input: $input) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      agent {\n        id\n      }\n      status\n      lastRun\n      nextRun\n    }\n  }\n"): typeof import('./graphql').UpdateAgentJobDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Notifications {\n    notifications {\n      id\n      agent {\n        id\n        name\n      }\n      type\n      turnId\n      message\n      actions {\n        id\n        label\n        style\n      }\n      status\n      resolvedAction\n      createdAt\n    }\n  }\n"): typeof import('./graphql').NotificationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResolveNotification($id: ID!, $actionId: String!) {\n    resolveNotification(id: $id, actionId: $actionId) {\n      id\n      status\n      resolvedAction\n    }\n  }\n"): typeof import('./graphql').ResolveNotificationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DismissNotification($id: ID!) {\n    dismissNotification(id: $id) {\n      id\n      status\n    }\n  }\n"): typeof import('./graphql').DismissNotificationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Profile {\n    profile {\n      displayName\n      about\n      website\n    }\n  }\n"): typeof import('./graphql').ProfileDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProfile($input: ProfileInput!) {\n    updateProfile(input: $input) {\n      displayName\n      about\n      website\n    }\n  }\n"): typeof import('./graphql').UpdateProfileDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Avatars {\n    avatars {\n      id\n      name\n      url(width: 200)\n    }\n  }\n"): typeof import('./graphql').AvatarsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Skills {\n    skills {\n      id\n      name\n      description\n      version\n      installed\n    }\n  }\n"): typeof import('./graphql').SkillsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Skill($id: ID!) {\n    skill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n"): typeof import('./graphql').SkillDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InstallSkill($id: ID!) {\n    installSkill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n"): typeof import('./graphql').InstallSkillDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UninstallSkill($id: ID!) {\n    uninstallSkill(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      installed\n      category\n      homepage\n      requiredEnv\n    }\n  }\n"): typeof import('./graphql').UninstallSkillDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Tasks($first: Int, $after: String, $last: Int, $before: String) {\n    tasks(first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          agent {\n            id\n            name\n          }\n          title\n          status\n          message\n          createdAt\n          documents {\n            id\n            title\n            body\n            createdAt\n            updatedAt\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n"): typeof import('./graphql').TasksDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      agent {\n        id\n      }\n      title\n      status\n      message\n      createdAt\n      updatedAt\n      completedAt\n      artifacts\n      documents {\n        id\n        title\n        body\n        createdAt\n        updatedAt\n      }\n      logs(last: 50) {\n        edges {\n          node {\n            id\n            role\n            content\n            toolName\n            toolInput\n            toolResult\n            taskId\n            createdAt\n          }\n        }\n        pageInfo {\n          hasNextPage\n          hasPreviousPage\n          startCursor\n          endCursor\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').TaskDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription TaskLogCreated($taskId: ID!) {\n    taskLogCreated(taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      taskId\n      createdAt\n    }\n  }\n"): typeof import('./graphql').TaskLogCreatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription TaskUpdated($taskId: ID!) {\n    taskUpdated(taskId: $taskId) {\n      id\n      title\n      status\n      message\n      updatedAt\n      completedAt\n      artifacts\n      documents {\n        id\n        title\n        body\n        updatedAt\n      }\n    }\n  }\n"): typeof import('./graphql').TaskUpdatedDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
