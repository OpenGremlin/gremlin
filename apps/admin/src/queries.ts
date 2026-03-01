export const AGENTS_QUERY = `query { agents { id name avatar portraitId imageUrl(width: 100) soul status statusReason } }`;

export const AGENT_QUERY = `query($id: ID!) { agent(id: $id) { id name avatar portraitId imageUrl(width: 100) soul status statusReason } }`;

export const STATUSES_QUERY = `query { statuses { id agent { id name status imageUrl(width: 100) } title summary category completedAt } }`;

export const STATUS_QUERY = `query($id: ID!) { status(id: $id) { id agent { id name status imageUrl(width: 100) } title summary artifacts { ... on Document { title body } } category completedAt } }`;

export const SKILLS_QUERY = `query { skills { id name description version installed } }`;

export const SKILL_QUERY = `query($id: ID!) { skill(id: $id) { id name description version author installed category homepage requiredEnv } }`;

export const AGENT_JOBS_QUERY = `query { agentJobs { id name description recurrence cronExpression agent { id name status imageUrl(width: 100) } status lastRun nextRun } }`;

export const AGENT_JOB_QUERY = `query($id: ID!) { agentJob(id: $id) { id name description recurrence cronExpression agent { id name status imageUrl(width: 100) } status lastRun nextRun statuses { id agent { id name status imageUrl(width: 100) } title summary category completedAt } } }`;

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
