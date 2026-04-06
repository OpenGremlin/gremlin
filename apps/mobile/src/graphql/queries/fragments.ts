import { graphql } from "../generated/gql";

// ── File ────────────────────────────────────────────────────────────

export const FileFields = graphql(`
  fragment FileFields on File {
    path
    name
    sizeBytes
    mimeType
    modifiedAt
    render {
      __typename
      ... on DocumentRender { markdown title }
      ... on CodeRender { content language }
      ... on ImageRender { url(width: 800) fullUrl: url width height aspectRatio }
      ... on AudioRender { url durationSeconds }
      ... on VideoRender { url thumbnailUrl(width: 400) durationSeconds }
      ... on UnknownRender { mimeType sizeBytes }
    }
  }
`);

// ── Attachment ──────────────────────────────────────────────────────

export const AttachmentFields = graphql(`
  fragment AttachmentFields on Attachment {
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
`);

// ── Agent ───────────────────────────────────────────────────────────

export const AgentSummary = graphql(`
  fragment AgentSummary on Agent {
    id
    name
    personality
    retired
  }
`);

export const AgentDetailFragment = graphql(`
  fragment AgentDetail on Agent {
    id
    name
    avatar
    portraitId
    imageUrl(width: 200)
    personality
    role
    retired
    ttsVoice
    config {
      model {
        type
        modelId
        connectionId
      }
      imageModel {
        type
        modelId
        connectionId
      }
      speechModel {
        type
        modelId
        connectionId
      }
      sandbox {
        enabled
        idleTimeoutMinutes
        alwaysOn
        commandApproval
      }
      webSearch {
        enabled
        provider
      }
      reasoning {
        enabled
      }
      viewImage {
        enabled
      }
      imageGeneration {
        enabled
      }
      speech {
        enabled
        voice
      }
      programs {
        enabled
      }
    }
  }
`);

// ── AgentLog ────────────────────────────────────────────────────────

export const AgentLogFields = graphql(`
  fragment AgentLogFields on AgentLog {
    id
    role
    content
    toolName
    toolInput
    toolResult
    displayHint
    displayVariant
    commandApprovalId
    attachments {
      ...AttachmentFields
    }
    files {
      ...FileFields
    }
    taskId
    createdAt
  }
`);

// ── Task ────────────────────────────────────────────────────────────

export const TaskSummary = graphql(`
  fragment TaskSummary on Task {
    id
    agent {
      ...AgentSummary
    }
    title
    message
    createdAt
    imageUrl(width: 200)
    files {
      ...FileFields
    }
  }
`);

export const TaskDetail = graphql(`
  fragment TaskDetail on Task {
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
      ...AttachmentFields
    }
    files {
      ...FileFields
    }
  }
`);

// ── AgentJob ────────────────────────────────────────────────────────

export const AgentJobSummary = graphql(`
  fragment AgentJobSummary on AgentJob {
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
`);

export const AgentJobDetail = graphql(`
  fragment AgentJobDetail on AgentJob {
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
`);

// ── CommandApproval ─────────────────────────────────────────────────

export const CommandApprovalFields = graphql(`
  fragment CommandApprovalFields on CommandApproval {
    id
    agent {
      id
      name
    }
    taskId
    command
    reason
    status
    decision
    createdAt
  }
`);

// ── UserInputRequest ────────────────────────────────────────────────

export const UserInputRequestFields = graphql(`
  fragment UserInputRequestFields on UserInputRequest {
    id
    agent {
      id
      name
    }
    turnId
    message
    actions {
      label
      style
    }
    status
    resolvedAction
    createdAt
  }
`);

// ── Skill ───────────────────────────────────────────────────────────

export const SkillTemplateFields = graphql(`
  fragment SkillTemplateFields on SkillTemplate {
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
`);

export const AgentSkillFields = graphql(`
  fragment AgentSkillFields on AgentSkill {
    skillId
    agentId
    assignedAt
    template {
      ...SkillTemplateFields
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
`);

// ── Integration ─────────────────────────────────────────────────────

export const IntegrationConnectionFields = graphql(`
  fragment IntegrationConnectionFields on IntegrationConnection {
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
      ... on AwsIamRoleConnectionMeta {
        accountId
        roleArn
        region
        displayName
      }
    }
  }
`);
