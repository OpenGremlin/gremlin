export const AGENTS_QUERY = `query { agents { id name avatar portraitId imageUrl(width: 100) soul status statusReason } }`;

export const AGENT_QUERY = `query($id: ID!) { agent(id: $id) { id name avatar portraitId imageUrl(width: 100) soul status statusReason } }`;

export const UPDATE_AGENT = `mutation($id: ID!, $input: UpdateAgentInput!) { updateAgent(id: $id, input: $input) { id name avatar portraitId imageUrl(width: 100) soul status statusReason } }`;

export const INSTALL_SKILL = `mutation($id: ID!) { installSkill(id: $id) { id name description version author installed category homepage requiredEnv } }`;

export const UNINSTALL_SKILL = `mutation($id: ID!) { uninstallSkill(id: $id) { id name description version author installed category homepage requiredEnv } }`;

export const TOGGLE_PERMISSION = `mutation($integrationId: ID!, $scope: String!, $enabled: Boolean!) { togglePermission(integrationId: $integrationId, scope: $scope, enabled: $enabled) { id service icon description account connectedAt authMethod permissions { scope label enabled } } }`;

export const TASKS_QUERY = `query($first: Int, $after: String, $last: Int, $before: String) {
  tasks(first: $first, after: $after, last: $last, before: $before) {
    edges { cursor node { id agent { id name status imageUrl(width: 100) } title status createdAt } }
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
  }
}`;

export const TASK_QUERY = `query($id: ID!) {
  task(id: $id) {
    id
    agent { id name status imageUrl(width: 100) }
    title
    status
    statusReason
    createdAt
    updatedAt
    completedAt
    artifacts
    documents { id title body createdAt updatedAt }
    logs(last: 50) {
      edges { node { id role content taskId createdAt } }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
}`;

export const SKILLS_QUERY = `query { skills { id name description version installed } }`;

export const SKILL_QUERY = `query($id: ID!) { skill(id: $id) { id name description version author installed category homepage requiredEnv } }`;

export const AGENT_JOBS_QUERY = `query { agentJobs { id name description recurrence cronExpression agent { id name status imageUrl(width: 100) } status lastRun nextRun } }`;

export const AGENT_JOB_QUERY = `query($id: ID!) { agentJob(id: $id) { id name description recurrence cronExpression agent { id name status imageUrl(width: 100) } status lastRun nextRun tasks { id agent { id name status imageUrl(width: 100) } title status createdAt } } }`;

export const UPDATE_AGENT_JOB = `mutation($id: ID!, $input: UpdateAgentJobInput!) { updateAgentJob(id: $id, input: $input) { id name description recurrence cronExpression agent { id name status imageUrl(width: 100) } status lastRun nextRun } }`;

export const PROFILE_QUERY = `query { profile { displayName about website } }`;

export const UPDATE_PROFILE = `mutation($input: ProfileInput!) { updateProfile(input: $input) { displayName about website } }`;

export const AVATARS_QUERY = `query { avatars { id name url(width: 200) } }`;

export const NOTIFICATIONS_QUERY = `query { notifications { id agent { id name status imageUrl(width: 100) } type turnId message actions { id label style } status resolvedAction createdAt } }`;

export const RESOLVE_NOTIFICATION = `mutation($id: ID!, $actionId: String!) { resolveNotification(id: $id, actionId: $actionId) { id status resolvedAction } }`;

export const DISMISS_NOTIFICATION = `mutation($id: ID!) { dismissNotification(id: $id) { id status } }`;

export const INTEGRATIONS_QUERY = `query { integrations { id service icon account } }`;

export const INTEGRATION_QUERY = `query($id: ID!) { integration(id: $id) { id service icon description account connectedAt authMethod permissions { scope label enabled } } }`;

export const AGENT_LOGS_QUERY = `query($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {
    edges { cursor node { id role content taskId createdAt } }
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
  }
}`;

export const SEND_MESSAGE_MUTATION = `mutation($agentId: ID!, $content: String!, $taskId: String) {
  sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {
    id role content taskId createdAt
  }
}`;

export const AGENT_LOG_SUBSCRIPTION = `subscription($agentId: ID!) {
  agentLogCreated(agentId: $agentId) { id role content taskId createdAt }
}`;

export const TASK_LOG_SUBSCRIPTION = `subscription($taskId: ID!) {
  taskLogCreated(taskId: $taskId) { id role content taskId createdAt }
}`;

export const TASK_UPDATED_SUBSCRIPTION = `subscription($taskId: ID!) {
  taskUpdated(taskId: $taskId) { id title status statusReason updatedAt completedAt artifacts documents { id title body updatedAt } }
}`;

export const DOCUMENT_QUERY = `query($id: ID!) {
  document(id: $id) { id title body createdAt updatedAt }
}`;

export const DOCUMENT_UPDATED_SUBSCRIPTION = `subscription($id: ID!) {
  documentUpdated(id: $id) { id title body updatedAt }
}`;
