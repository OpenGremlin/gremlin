export const AGENTS_QUERY = `query { agents { id name avatar portraitId imageUrl(width: 100) soul status } }`;

export const AGENT_QUERY = `query($id: ID!) { agent(id: $id) { id name avatar portraitId imageUrl(width: 100) soul status } }`;

export const FEED_ITEMS_QUERY = `query { feedItems { id agent { id name status imageUrl(width: 100) } title summary category completedAt } }`;

export const FEED_ITEM_QUERY = `query($id: ID!) { feedItem(id: $id) { id agent { id name status imageUrl(width: 100) } title summary body category completedAt } }`;

export const SKILLS_QUERY = `query { skills { id name description version installed } }`;

export const SKILL_QUERY = `query($id: ID!) { skill(id: $id) { id name description version author installed category homepage requiredEnv } }`;

export const AGENT_JOBS_QUERY = `query { agentJobs { id name description recurrence status lastRun nextRun } }`;

export const AGENT_JOB_QUERY = `query($id: ID!) { agentJob(id: $id) { id name description recurrence status lastRun nextRun } }`;

export const AVATARS_QUERY = `query { avatars { id name url(width: 200) } }`;

export const NOTIFICATIONS_QUERY = `query { notifications { id agent { id name imageUrl(width: 100) } type message actions { id label style } status resolvedAction createdAt } }`;

export const RESOLVE_NOTIFICATION = `mutation($id: ID!, $actionId: String!) { resolveNotification(id: $id, actionId: $actionId) { id status resolvedAction } }`;

export const DISMISS_NOTIFICATION = `mutation($id: ID!) { dismissNotification(id: $id) { id status } }`;

export const INTEGRATIONS_QUERY = `query { integrations { id service icon account } }`;

export const INTEGRATION_QUERY = `query($id: ID!) { integration(id: $id) { id service icon description account connectedAt authMethod permissions { scope label enabled } } }`;
