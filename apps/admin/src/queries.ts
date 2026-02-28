export const AGENTS_QUERY = `query { agents { id name avatar soul status } }`;

export const AGENT_QUERY = `query($id: ID!) { agent(id: $id) { id name avatar soul status } }`;

export const FEED_ITEMS_QUERY = `query { feedItems { id agentName avatarState title summary body category completedAt } }`;

export const FEED_ITEM_QUERY = `query($id: ID!) { feedItem(id: $id) { id agentName avatarState title summary body category completedAt } }`;

export const SKILLS_QUERY = `query { skills { id name description version author installed category homepage requiredEnv } }`;

export const SKILL_QUERY = `query($id: ID!) { skill(id: $id) { id name description version author installed category homepage requiredEnv } }`;

export const AGENT_JOBS_QUERY = `query { agentJobs { id name description recurrence status lastRun nextRun } }`;

export const AGENT_JOB_QUERY = `query($id: ID!) { agentJob(id: $id) { id name description recurrence status lastRun nextRun } }`;

export const INTEGRATIONS_QUERY = `query { integrations { id service icon description account connectedAt authMethod permissions { scope label enabled } } }`;

export const INTEGRATION_QUERY = `query($id: ID!) { integration(id: $id) { id service icon description account connectedAt authMethod permissions { scope label enabled } } }`;
