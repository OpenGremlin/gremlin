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
    "\n  query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          documents {\n            path\n            title\n            body\n          }\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": typeof types.AgentLogsDocument,
    "\n  mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {\n    sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {\n      queued\n      content\n    }\n  }\n": typeof types.SendMessageDocument,
    "\n  mutation RequestFileUploads($agentId: String!, $taskId: String, $files: [FileUploadRequest!]!) {\n    requestFileUploads(agentId: $agentId, taskId: $taskId, files: $files) {\n      uploadId\n      presignedUrl\n      key\n    }\n  }\n": typeof types.RequestFileUploadsDocument,
    "\n  mutation CompleteFileUpload($input: CompleteFileUploadInput!) {\n    completeFileUpload(input: $input) {\n      path\n      filename\n      sizeBytes\n      contentType\n    }\n  }\n": typeof types.CompleteFileUploadDocument,
    "\n  subscription AgentLogCreated($agentId: ID!) {\n    agentLogCreated(agentId: $agentId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      documents {\n        path\n        title\n        body\n      }\n      taskId\n      createdAt\n    }\n  }\n": typeof types.AgentLogCreatedDocument,
    "\n  fragment AgentDetail on Agent {\n    id\n    name\n    avatar\n    portraitId\n    imageUrl(width: 200)\n    soul\n    retired\n    ttsVoice\n    config {\n      model {\n        type\n        modelId\n        connectionId\n      }\n      sandbox {\n        enabled\n        idleTimeoutMinutes\n        alwaysOn\n      }\n      webSearch {\n        enabled\n        provider\n      }\n    }\n  }\n": typeof types.AgentDetailFragmentDoc,
    "\n  query Agents {\n    agents {\n      id\n      name\n      soul\n      retired\n    }\n  }\n": typeof types.AgentsDocument,
    "\n  query Agent($id: ID!) {\n    agent(id: $id) {\n      ...AgentDetail\n    }\n  }\n": typeof types.AgentDocument,
    "\n  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {\n    updateAgent(id: $id, input: $input) {\n      ...AgentDetail\n    }\n  }\n": typeof types.UpdateAgentDocument,
    "\n  mutation CreateAgent($input: CreateAgentInput!) {\n    createAgent(input: $input) {\n      id\n      name\n      soul\n    }\n  }\n": typeof types.CreateAgentDocument,
    "\n  mutation RetireAgent($id: ID!) {\n    retireAgent(id: $id) {\n      id\n      retired\n    }\n  }\n": typeof types.RetireAgentDocument,
    "\n  mutation UnretireAgent($id: ID!) {\n    unretireAgent(id: $id) {\n      id\n      retired\n    }\n  }\n": typeof types.UnretireAgentDocument,
    "\n  subscription AgentUpdated($agentId: ID!) {\n    agentUpdated(agentId: $agentId) {\n      ...AgentDetail\n    }\n  }\n": typeof types.AgentUpdatedDocument,
    "\n  query IntegrationProviders {\n    integrationProviders {\n      id\n      service\n      category\n      description\n      connectionType\n      availableScopes {\n        scope\n        label\n      }\n      models {\n        id\n        name\n        contextWindow\n        maxTokens\n        reasoning\n        inputCost\n        outputCost\n      }\n      connectionCount\n      hasConnection\n    }\n    defaultModel {\n      providerId\n      modelId\n    }\n  }\n": typeof types.IntegrationProvidersDocument,
    "\n  query IntegrationConnections {\n    integrationConnections {\n      id\n      providerId\n      connectionType\n      description\n      connectedAt\n      isRevoked\n      meta {\n        __typename\n        ... on OAuthConnectionMeta {\n          accountId\n          scopes\n          expiresAt\n        }\n        ... on ApiKeyConnectionMeta {\n          accountId\n        }\n      }\n    }\n  }\n": typeof types.IntegrationConnectionsDocument,
    "\n  mutation ConnectApiKey($providerId: String!, $apiKey: String!) {\n    connectApiKey(providerId: $providerId, apiKey: $apiKey)\n  }\n": typeof types.ConnectApiKeyDocument,
    "\n  mutation RenameConnection($id: ID!, $description: String!) {\n    renameIntegrationConnection(id: $id, description: $description)\n  }\n": typeof types.RenameConnectionDocument,
    "\n  mutation RevokeConnection($id: ID!) {\n    revokeIntegrationConnection(id: $id)\n  }\n": typeof types.RevokeConnectionDocument,
    "\n  mutation SetDefaultModel($providerId: String!, $modelId: String!) {\n    setDefaultModel(providerId: $providerId, modelId: $modelId)\n  }\n": typeof types.SetDefaultModelDocument,
    "\n  query BedrockEnabledModels {\n    bedrockEnabledModels\n  }\n": typeof types.BedrockEnabledModelsDocument,
    "\n  mutation EnableBedrockModel($modelId: String!) {\n    enableBedrockModel(modelId: $modelId)\n  }\n": typeof types.EnableBedrockModelDocument,
    "\n  mutation DisableBedrockModel($modelId: String!) {\n    disableBedrockModel(modelId: $modelId)\n  }\n": typeof types.DisableBedrockModelDocument,
    "\n  query AgentJobs {\n    agentJobs {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n      }\n      paused\n      lastRun\n      nextRun\n    }\n  }\n": typeof types.AgentJobsDocument,
    "\n  query AgentJob($id: ID!) {\n    agentJob(id: $id) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n        name\n      }\n      paused\n      lastRun\n      nextRun\n      tasks {\n        id\n        agent {\n          id\n        }\n        title\n        createdAt\n      }\n    }\n  }\n": typeof types.AgentJobDocument,
    "\n  mutation DeleteAgentJob($id: ID!) {\n    deleteAgentJob(id: $id) { id }\n  }\n": typeof types.DeleteAgentJobDocument,
    "\n  mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {\n    updateAgentJob(id: $id, input: $input) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n      }\n      paused\n      lastRun\n      nextRun\n    }\n  }\n": typeof types.UpdateAgentJobDocument,
    "\n  subscription JobTaskCreated($jobId: ID!) {\n    jobTaskCreated(jobId: $jobId) {\n      id\n      agent {\n        id\n      }\n      title\n      createdAt\n    }\n  }\n": typeof types.JobTaskCreatedDocument,
    "\n  mutation TriggerJob($id: ID!) {\n    triggerJob(id: $id)\n  }\n": typeof types.TriggerJobDocument,
    "\n  mutation CreateAgentJob($input: CreateAgentJobInput!) {\n    createAgentJob(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateAgentJobDocument,
    "\n  query Notifications {\n    notifications {\n      id\n      agent {\n        id\n        name\n      }\n      type\n      turnId\n      message\n      actions {\n        id\n        label\n        style\n      }\n      status\n      resolvedAction\n      createdAt\n    }\n  }\n": typeof types.NotificationsDocument,
    "\n  mutation ResolveNotification($id: ID!, $actionId: String!) {\n    resolveNotification(id: $id, actionId: $actionId) {\n      id\n      status\n      resolvedAction\n    }\n  }\n": typeof types.ResolveNotificationDocument,
    "\n  mutation DismissNotification($id: ID!) {\n    dismissNotification(id: $id) {\n      id\n      status\n    }\n  }\n": typeof types.DismissNotificationDocument,
    "\n  query Profile {\n    profile {\n      displayName\n      about\n      website\n      timezone\n    }\n  }\n": typeof types.ProfileDocument,
    "\n  mutation UpdateProfile($input: ProfileInput!) {\n    updateProfile(input: $input) {\n      displayName\n      about\n      website\n      timezone\n    }\n  }\n": typeof types.UpdateProfileDocument,
    "\n  query Avatars {\n    avatars {\n      id\n      name\n      url(width: 200)\n    }\n  }\n": typeof types.AvatarsDocument,
    "\n  query GlobalSettings {\n    globalSettings {\n      signupDisabled\n    }\n  }\n": typeof types.GlobalSettingsDocument,
    "\n  mutation UpdateGlobalSettings($signupDisabled: Boolean) {\n    updateGlobalSettings(signupDisabled: $signupDisabled) {\n      signupDisabled\n    }\n  }\n": typeof types.UpdateGlobalSettingsDocument,
    "\n  query SkillTemplates {\n    skillTemplates {\n      id\n      name\n      description\n      version\n      author\n      category\n      icon\n      tags\n      hasInstall\n      connections {\n        provider\n        providerName\n        reason\n        optional\n        requestedScopes\n      }\n    }\n  }\n": typeof types.SkillTemplatesDocument,
    "\n  query SkillTemplate($id: ID!) {\n    skillTemplate(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      category\n      icon\n      tags\n      hasInstall\n      connections {\n        provider\n        providerName\n        reason\n        optional\n        requestedScopes\n      }\n    }\n  }\n": typeof types.SkillTemplateDocument,
    "\n  query AgentSkills($agentId: ID!) {\n    agentSkills(agentId: $agentId) {\n      skillId\n      agentId\n      assignedAt\n      template {\n        id\n        name\n        description\n        version\n        category\n        icon\n        connections {\n          provider\n          providerName\n          reason\n          optional\n        }\n      }\n      connectionStatuses {\n        provider\n        providerName\n        reason\n        optional\n        boundConnectionId\n        connected\n      }\n    }\n  }\n": typeof types.AgentSkillsDocument,
    "\n  mutation AssignSkill($agentId: ID!, $skillId: ID!) {\n    assignSkill(agentId: $agentId, skillId: $skillId) {\n      skillId\n      agentId\n      assignedAt\n      template {\n        id\n        name\n        description\n        version\n        category\n        icon\n      }\n      connectionStatuses {\n        provider\n        providerName\n        reason\n        optional\n        boundConnectionId\n        connected\n      }\n    }\n  }\n": typeof types.AssignSkillDocument,
    "\n  mutation RemoveSkill($agentId: ID!, $skillId: ID!) {\n    removeSkill(agentId: $agentId, skillId: $skillId)\n  }\n": typeof types.RemoveSkillDocument,
    "\n  mutation BindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {\n    bindAgentSkillConnection(agentId: $agentId, skillId: $skillId, provider: $provider, connectionId: $connectionId) {\n      skillId\n      agentId\n      connectionStatuses {\n        provider\n        boundConnectionId\n        connected\n      }\n    }\n  }\n": typeof types.BindAgentSkillConnectionDocument,
    "\n  query Tasks($first: Int, $after: String, $last: Int, $before: String) {\n    tasks(first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          agent {\n            id\n            name\n          }\n          title\n          message\n          createdAt\n          imageUrl(width: 200)\n          documents {\n            path\n            title\n            body\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": typeof types.TasksDocument,
    "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      agent {\n        id\n      }\n      title\n      message\n      createdAt\n      updatedAt\n      completedAt\n      imageUrl(width: 200)\n      artifacts\n      documents {\n        path\n        title\n        body\n      }\n    }\n  }\n": typeof types.TaskDocument,
    "\n  query TaskLogs($taskId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    taskLogs(taskId: $taskId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          documents {\n            path\n            title\n            body\n          }\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": typeof types.TaskLogsDocument,
    "\n  subscription TaskLogCreated($taskId: ID!) {\n    taskLogCreated(taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      documents {\n        path\n        title\n        body\n      }\n      taskId\n      createdAt\n    }\n  }\n": typeof types.TaskLogCreatedDocument,
    "\n  subscription TaskUpdated($taskId: ID!) {\n    taskUpdated(taskId: $taskId) {\n      id\n      title\n      message\n      updatedAt\n      completedAt\n      imageUrl(width: 200)\n      artifacts\n      documents {\n        path\n        title\n        body\n      }\n    }\n  }\n": typeof types.TaskUpdatedDocument,
    "\n  subscription SandboxOutput($taskId: ID!) {\n    sandboxOutput(taskId: $taskId) {\n      commandId\n      stream\n      data\n      done\n      exitCode\n    }\n  }\n": typeof types.SandboxOutputDocument,
    "\n  query WorkspaceEntries($path: String!) {\n    workspaceEntries(path: $path) {\n      name\n      path\n      isDirectory\n      size\n      modifiedAt\n    }\n  }\n": typeof types.WorkspaceEntriesDocument,
    "\n  query WorkspaceFile($path: String!) {\n    workspaceFile(path: $path)\n  }\n": typeof types.WorkspaceFileDocument,
};
const documents: Documents = {
    "\n  query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          documents {\n            path\n            title\n            body\n          }\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": types.AgentLogsDocument,
    "\n  mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {\n    sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {\n      queued\n      content\n    }\n  }\n": types.SendMessageDocument,
    "\n  mutation RequestFileUploads($agentId: String!, $taskId: String, $files: [FileUploadRequest!]!) {\n    requestFileUploads(agentId: $agentId, taskId: $taskId, files: $files) {\n      uploadId\n      presignedUrl\n      key\n    }\n  }\n": types.RequestFileUploadsDocument,
    "\n  mutation CompleteFileUpload($input: CompleteFileUploadInput!) {\n    completeFileUpload(input: $input) {\n      path\n      filename\n      sizeBytes\n      contentType\n    }\n  }\n": types.CompleteFileUploadDocument,
    "\n  subscription AgentLogCreated($agentId: ID!) {\n    agentLogCreated(agentId: $agentId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      documents {\n        path\n        title\n        body\n      }\n      taskId\n      createdAt\n    }\n  }\n": types.AgentLogCreatedDocument,
    "\n  fragment AgentDetail on Agent {\n    id\n    name\n    avatar\n    portraitId\n    imageUrl(width: 200)\n    soul\n    retired\n    ttsVoice\n    config {\n      model {\n        type\n        modelId\n        connectionId\n      }\n      sandbox {\n        enabled\n        idleTimeoutMinutes\n        alwaysOn\n      }\n      webSearch {\n        enabled\n        provider\n      }\n    }\n  }\n": types.AgentDetailFragmentDoc,
    "\n  query Agents {\n    agents {\n      id\n      name\n      soul\n      retired\n    }\n  }\n": types.AgentsDocument,
    "\n  query Agent($id: ID!) {\n    agent(id: $id) {\n      ...AgentDetail\n    }\n  }\n": types.AgentDocument,
    "\n  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {\n    updateAgent(id: $id, input: $input) {\n      ...AgentDetail\n    }\n  }\n": types.UpdateAgentDocument,
    "\n  mutation CreateAgent($input: CreateAgentInput!) {\n    createAgent(input: $input) {\n      id\n      name\n      soul\n    }\n  }\n": types.CreateAgentDocument,
    "\n  mutation RetireAgent($id: ID!) {\n    retireAgent(id: $id) {\n      id\n      retired\n    }\n  }\n": types.RetireAgentDocument,
    "\n  mutation UnretireAgent($id: ID!) {\n    unretireAgent(id: $id) {\n      id\n      retired\n    }\n  }\n": types.UnretireAgentDocument,
    "\n  subscription AgentUpdated($agentId: ID!) {\n    agentUpdated(agentId: $agentId) {\n      ...AgentDetail\n    }\n  }\n": types.AgentUpdatedDocument,
    "\n  query IntegrationProviders {\n    integrationProviders {\n      id\n      service\n      category\n      description\n      connectionType\n      availableScopes {\n        scope\n        label\n      }\n      models {\n        id\n        name\n        contextWindow\n        maxTokens\n        reasoning\n        inputCost\n        outputCost\n      }\n      connectionCount\n      hasConnection\n    }\n    defaultModel {\n      providerId\n      modelId\n    }\n  }\n": types.IntegrationProvidersDocument,
    "\n  query IntegrationConnections {\n    integrationConnections {\n      id\n      providerId\n      connectionType\n      description\n      connectedAt\n      isRevoked\n      meta {\n        __typename\n        ... on OAuthConnectionMeta {\n          accountId\n          scopes\n          expiresAt\n        }\n        ... on ApiKeyConnectionMeta {\n          accountId\n        }\n      }\n    }\n  }\n": types.IntegrationConnectionsDocument,
    "\n  mutation ConnectApiKey($providerId: String!, $apiKey: String!) {\n    connectApiKey(providerId: $providerId, apiKey: $apiKey)\n  }\n": types.ConnectApiKeyDocument,
    "\n  mutation RenameConnection($id: ID!, $description: String!) {\n    renameIntegrationConnection(id: $id, description: $description)\n  }\n": types.RenameConnectionDocument,
    "\n  mutation RevokeConnection($id: ID!) {\n    revokeIntegrationConnection(id: $id)\n  }\n": types.RevokeConnectionDocument,
    "\n  mutation SetDefaultModel($providerId: String!, $modelId: String!) {\n    setDefaultModel(providerId: $providerId, modelId: $modelId)\n  }\n": types.SetDefaultModelDocument,
    "\n  query BedrockEnabledModels {\n    bedrockEnabledModels\n  }\n": types.BedrockEnabledModelsDocument,
    "\n  mutation EnableBedrockModel($modelId: String!) {\n    enableBedrockModel(modelId: $modelId)\n  }\n": types.EnableBedrockModelDocument,
    "\n  mutation DisableBedrockModel($modelId: String!) {\n    disableBedrockModel(modelId: $modelId)\n  }\n": types.DisableBedrockModelDocument,
    "\n  query AgentJobs {\n    agentJobs {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n      }\n      paused\n      lastRun\n      nextRun\n    }\n  }\n": types.AgentJobsDocument,
    "\n  query AgentJob($id: ID!) {\n    agentJob(id: $id) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n        name\n      }\n      paused\n      lastRun\n      nextRun\n      tasks {\n        id\n        agent {\n          id\n        }\n        title\n        createdAt\n      }\n    }\n  }\n": types.AgentJobDocument,
    "\n  mutation DeleteAgentJob($id: ID!) {\n    deleteAgentJob(id: $id) { id }\n  }\n": types.DeleteAgentJobDocument,
    "\n  mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {\n    updateAgentJob(id: $id, input: $input) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n      }\n      paused\n      lastRun\n      nextRun\n    }\n  }\n": types.UpdateAgentJobDocument,
    "\n  subscription JobTaskCreated($jobId: ID!) {\n    jobTaskCreated(jobId: $jobId) {\n      id\n      agent {\n        id\n      }\n      title\n      createdAt\n    }\n  }\n": types.JobTaskCreatedDocument,
    "\n  mutation TriggerJob($id: ID!) {\n    triggerJob(id: $id)\n  }\n": types.TriggerJobDocument,
    "\n  mutation CreateAgentJob($input: CreateAgentJobInput!) {\n    createAgentJob(input: $input) {\n      id\n    }\n  }\n": types.CreateAgentJobDocument,
    "\n  query Notifications {\n    notifications {\n      id\n      agent {\n        id\n        name\n      }\n      type\n      turnId\n      message\n      actions {\n        id\n        label\n        style\n      }\n      status\n      resolvedAction\n      createdAt\n    }\n  }\n": types.NotificationsDocument,
    "\n  mutation ResolveNotification($id: ID!, $actionId: String!) {\n    resolveNotification(id: $id, actionId: $actionId) {\n      id\n      status\n      resolvedAction\n    }\n  }\n": types.ResolveNotificationDocument,
    "\n  mutation DismissNotification($id: ID!) {\n    dismissNotification(id: $id) {\n      id\n      status\n    }\n  }\n": types.DismissNotificationDocument,
    "\n  query Profile {\n    profile {\n      displayName\n      about\n      website\n      timezone\n    }\n  }\n": types.ProfileDocument,
    "\n  mutation UpdateProfile($input: ProfileInput!) {\n    updateProfile(input: $input) {\n      displayName\n      about\n      website\n      timezone\n    }\n  }\n": types.UpdateProfileDocument,
    "\n  query Avatars {\n    avatars {\n      id\n      name\n      url(width: 200)\n    }\n  }\n": types.AvatarsDocument,
    "\n  query GlobalSettings {\n    globalSettings {\n      signupDisabled\n    }\n  }\n": types.GlobalSettingsDocument,
    "\n  mutation UpdateGlobalSettings($signupDisabled: Boolean) {\n    updateGlobalSettings(signupDisabled: $signupDisabled) {\n      signupDisabled\n    }\n  }\n": types.UpdateGlobalSettingsDocument,
    "\n  query SkillTemplates {\n    skillTemplates {\n      id\n      name\n      description\n      version\n      author\n      category\n      icon\n      tags\n      hasInstall\n      connections {\n        provider\n        providerName\n        reason\n        optional\n        requestedScopes\n      }\n    }\n  }\n": types.SkillTemplatesDocument,
    "\n  query SkillTemplate($id: ID!) {\n    skillTemplate(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      category\n      icon\n      tags\n      hasInstall\n      connections {\n        provider\n        providerName\n        reason\n        optional\n        requestedScopes\n      }\n    }\n  }\n": types.SkillTemplateDocument,
    "\n  query AgentSkills($agentId: ID!) {\n    agentSkills(agentId: $agentId) {\n      skillId\n      agentId\n      assignedAt\n      template {\n        id\n        name\n        description\n        version\n        category\n        icon\n        connections {\n          provider\n          providerName\n          reason\n          optional\n        }\n      }\n      connectionStatuses {\n        provider\n        providerName\n        reason\n        optional\n        boundConnectionId\n        connected\n      }\n    }\n  }\n": types.AgentSkillsDocument,
    "\n  mutation AssignSkill($agentId: ID!, $skillId: ID!) {\n    assignSkill(agentId: $agentId, skillId: $skillId) {\n      skillId\n      agentId\n      assignedAt\n      template {\n        id\n        name\n        description\n        version\n        category\n        icon\n      }\n      connectionStatuses {\n        provider\n        providerName\n        reason\n        optional\n        boundConnectionId\n        connected\n      }\n    }\n  }\n": types.AssignSkillDocument,
    "\n  mutation RemoveSkill($agentId: ID!, $skillId: ID!) {\n    removeSkill(agentId: $agentId, skillId: $skillId)\n  }\n": types.RemoveSkillDocument,
    "\n  mutation BindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {\n    bindAgentSkillConnection(agentId: $agentId, skillId: $skillId, provider: $provider, connectionId: $connectionId) {\n      skillId\n      agentId\n      connectionStatuses {\n        provider\n        boundConnectionId\n        connected\n      }\n    }\n  }\n": types.BindAgentSkillConnectionDocument,
    "\n  query Tasks($first: Int, $after: String, $last: Int, $before: String) {\n    tasks(first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          agent {\n            id\n            name\n          }\n          title\n          message\n          createdAt\n          imageUrl(width: 200)\n          documents {\n            path\n            title\n            body\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": types.TasksDocument,
    "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      agent {\n        id\n      }\n      title\n      message\n      createdAt\n      updatedAt\n      completedAt\n      imageUrl(width: 200)\n      artifacts\n      documents {\n        path\n        title\n        body\n      }\n    }\n  }\n": types.TaskDocument,
    "\n  query TaskLogs($taskId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    taskLogs(taskId: $taskId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          documents {\n            path\n            title\n            body\n          }\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": types.TaskLogsDocument,
    "\n  subscription TaskLogCreated($taskId: ID!) {\n    taskLogCreated(taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      documents {\n        path\n        title\n        body\n      }\n      taskId\n      createdAt\n    }\n  }\n": types.TaskLogCreatedDocument,
    "\n  subscription TaskUpdated($taskId: ID!) {\n    taskUpdated(taskId: $taskId) {\n      id\n      title\n      message\n      updatedAt\n      completedAt\n      imageUrl(width: 200)\n      artifacts\n      documents {\n        path\n        title\n        body\n      }\n    }\n  }\n": types.TaskUpdatedDocument,
    "\n  subscription SandboxOutput($taskId: ID!) {\n    sandboxOutput(taskId: $taskId) {\n      commandId\n      stream\n      data\n      done\n      exitCode\n    }\n  }\n": types.SandboxOutputDocument,
    "\n  query WorkspaceEntries($path: String!) {\n    workspaceEntries(path: $path) {\n      name\n      path\n      isDirectory\n      size\n      modifiedAt\n    }\n  }\n": types.WorkspaceEntriesDocument,
    "\n  query WorkspaceFile($path: String!) {\n    workspaceFile(path: $path)\n  }\n": types.WorkspaceFileDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AgentLogs($agentId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    agentLogs(agentId: $agentId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          documents {\n            path\n            title\n            body\n          }\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n"): typeof import('./graphql').AgentLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendMessage($agentId: ID!, $content: String!, $taskId: String) {\n    sendMessage(agentId: $agentId, content: $content, taskId: $taskId) {\n      queued\n      content\n    }\n  }\n"): typeof import('./graphql').SendMessageDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestFileUploads($agentId: String!, $taskId: String, $files: [FileUploadRequest!]!) {\n    requestFileUploads(agentId: $agentId, taskId: $taskId, files: $files) {\n      uploadId\n      presignedUrl\n      key\n    }\n  }\n"): typeof import('./graphql').RequestFileUploadsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteFileUpload($input: CompleteFileUploadInput!) {\n    completeFileUpload(input: $input) {\n      path\n      filename\n      sizeBytes\n      contentType\n    }\n  }\n"): typeof import('./graphql').CompleteFileUploadDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription AgentLogCreated($agentId: ID!) {\n    agentLogCreated(agentId: $agentId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      documents {\n        path\n        title\n        body\n      }\n      taskId\n      createdAt\n    }\n  }\n"): typeof import('./graphql').AgentLogCreatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AgentDetail on Agent {\n    id\n    name\n    avatar\n    portraitId\n    imageUrl(width: 200)\n    soul\n    retired\n    ttsVoice\n    config {\n      model {\n        type\n        modelId\n        connectionId\n      }\n      sandbox {\n        enabled\n        idleTimeoutMinutes\n        alwaysOn\n      }\n      webSearch {\n        enabled\n        provider\n      }\n    }\n  }\n"): typeof import('./graphql').AgentDetailFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Agents {\n    agents {\n      id\n      name\n      soul\n      retired\n    }\n  }\n"): typeof import('./graphql').AgentsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Agent($id: ID!) {\n    agent(id: $id) {\n      ...AgentDetail\n    }\n  }\n"): typeof import('./graphql').AgentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAgent($id: ID!, $input: UpdateAgentInput!) {\n    updateAgent(id: $id, input: $input) {\n      ...AgentDetail\n    }\n  }\n"): typeof import('./graphql').UpdateAgentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAgent($input: CreateAgentInput!) {\n    createAgent(input: $input) {\n      id\n      name\n      soul\n    }\n  }\n"): typeof import('./graphql').CreateAgentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RetireAgent($id: ID!) {\n    retireAgent(id: $id) {\n      id\n      retired\n    }\n  }\n"): typeof import('./graphql').RetireAgentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UnretireAgent($id: ID!) {\n    unretireAgent(id: $id) {\n      id\n      retired\n    }\n  }\n"): typeof import('./graphql').UnretireAgentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription AgentUpdated($agentId: ID!) {\n    agentUpdated(agentId: $agentId) {\n      ...AgentDetail\n    }\n  }\n"): typeof import('./graphql').AgentUpdatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query IntegrationProviders {\n    integrationProviders {\n      id\n      service\n      category\n      description\n      connectionType\n      availableScopes {\n        scope\n        label\n      }\n      models {\n        id\n        name\n        contextWindow\n        maxTokens\n        reasoning\n        inputCost\n        outputCost\n      }\n      connectionCount\n      hasConnection\n    }\n    defaultModel {\n      providerId\n      modelId\n    }\n  }\n"): typeof import('./graphql').IntegrationProvidersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query IntegrationConnections {\n    integrationConnections {\n      id\n      providerId\n      connectionType\n      description\n      connectedAt\n      isRevoked\n      meta {\n        __typename\n        ... on OAuthConnectionMeta {\n          accountId\n          scopes\n          expiresAt\n        }\n        ... on ApiKeyConnectionMeta {\n          accountId\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').IntegrationConnectionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConnectApiKey($providerId: String!, $apiKey: String!) {\n    connectApiKey(providerId: $providerId, apiKey: $apiKey)\n  }\n"): typeof import('./graphql').ConnectApiKeyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RenameConnection($id: ID!, $description: String!) {\n    renameIntegrationConnection(id: $id, description: $description)\n  }\n"): typeof import('./graphql').RenameConnectionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RevokeConnection($id: ID!) {\n    revokeIntegrationConnection(id: $id)\n  }\n"): typeof import('./graphql').RevokeConnectionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetDefaultModel($providerId: String!, $modelId: String!) {\n    setDefaultModel(providerId: $providerId, modelId: $modelId)\n  }\n"): typeof import('./graphql').SetDefaultModelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BedrockEnabledModels {\n    bedrockEnabledModels\n  }\n"): typeof import('./graphql').BedrockEnabledModelsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EnableBedrockModel($modelId: String!) {\n    enableBedrockModel(modelId: $modelId)\n  }\n"): typeof import('./graphql').EnableBedrockModelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DisableBedrockModel($modelId: String!) {\n    disableBedrockModel(modelId: $modelId)\n  }\n"): typeof import('./graphql').DisableBedrockModelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AgentJobs {\n    agentJobs {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n      }\n      paused\n      lastRun\n      nextRun\n    }\n  }\n"): typeof import('./graphql').AgentJobsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AgentJob($id: ID!) {\n    agentJob(id: $id) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n        name\n      }\n      paused\n      lastRun\n      nextRun\n      tasks {\n        id\n        agent {\n          id\n        }\n        title\n        createdAt\n      }\n    }\n  }\n"): typeof import('./graphql').AgentJobDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAgentJob($id: ID!) {\n    deleteAgentJob(id: $id) { id }\n  }\n"): typeof import('./graphql').DeleteAgentJobDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAgentJob($id: ID!, $input: UpdateAgentJobInput!) {\n    updateAgentJob(id: $id, input: $input) {\n      id\n      name\n      description\n      recurrence\n      cronExpression\n      timezone\n      agent {\n        id\n      }\n      paused\n      lastRun\n      nextRun\n    }\n  }\n"): typeof import('./graphql').UpdateAgentJobDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription JobTaskCreated($jobId: ID!) {\n    jobTaskCreated(jobId: $jobId) {\n      id\n      agent {\n        id\n      }\n      title\n      createdAt\n    }\n  }\n"): typeof import('./graphql').JobTaskCreatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TriggerJob($id: ID!) {\n    triggerJob(id: $id)\n  }\n"): typeof import('./graphql').TriggerJobDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAgentJob($input: CreateAgentJobInput!) {\n    createAgentJob(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').CreateAgentJobDocument;
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
export function graphql(source: "\n  query Profile {\n    profile {\n      displayName\n      about\n      website\n      timezone\n    }\n  }\n"): typeof import('./graphql').ProfileDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProfile($input: ProfileInput!) {\n    updateProfile(input: $input) {\n      displayName\n      about\n      website\n      timezone\n    }\n  }\n"): typeof import('./graphql').UpdateProfileDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Avatars {\n    avatars {\n      id\n      name\n      url(width: 200)\n    }\n  }\n"): typeof import('./graphql').AvatarsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GlobalSettings {\n    globalSettings {\n      signupDisabled\n    }\n  }\n"): typeof import('./graphql').GlobalSettingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateGlobalSettings($signupDisabled: Boolean) {\n    updateGlobalSettings(signupDisabled: $signupDisabled) {\n      signupDisabled\n    }\n  }\n"): typeof import('./graphql').UpdateGlobalSettingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SkillTemplates {\n    skillTemplates {\n      id\n      name\n      description\n      version\n      author\n      category\n      icon\n      tags\n      hasInstall\n      connections {\n        provider\n        providerName\n        reason\n        optional\n        requestedScopes\n      }\n    }\n  }\n"): typeof import('./graphql').SkillTemplatesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SkillTemplate($id: ID!) {\n    skillTemplate(id: $id) {\n      id\n      name\n      description\n      version\n      author\n      category\n      icon\n      tags\n      hasInstall\n      connections {\n        provider\n        providerName\n        reason\n        optional\n        requestedScopes\n      }\n    }\n  }\n"): typeof import('./graphql').SkillTemplateDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AgentSkills($agentId: ID!) {\n    agentSkills(agentId: $agentId) {\n      skillId\n      agentId\n      assignedAt\n      template {\n        id\n        name\n        description\n        version\n        category\n        icon\n        connections {\n          provider\n          providerName\n          reason\n          optional\n        }\n      }\n      connectionStatuses {\n        provider\n        providerName\n        reason\n        optional\n        boundConnectionId\n        connected\n      }\n    }\n  }\n"): typeof import('./graphql').AgentSkillsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AssignSkill($agentId: ID!, $skillId: ID!) {\n    assignSkill(agentId: $agentId, skillId: $skillId) {\n      skillId\n      agentId\n      assignedAt\n      template {\n        id\n        name\n        description\n        version\n        category\n        icon\n      }\n      connectionStatuses {\n        provider\n        providerName\n        reason\n        optional\n        boundConnectionId\n        connected\n      }\n    }\n  }\n"): typeof import('./graphql').AssignSkillDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveSkill($agentId: ID!, $skillId: ID!) {\n    removeSkill(agentId: $agentId, skillId: $skillId)\n  }\n"): typeof import('./graphql').RemoveSkillDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BindAgentSkillConnection($agentId: ID!, $skillId: ID!, $provider: String!, $connectionId: ID!) {\n    bindAgentSkillConnection(agentId: $agentId, skillId: $skillId, provider: $provider, connectionId: $connectionId) {\n      skillId\n      agentId\n      connectionStatuses {\n        provider\n        boundConnectionId\n        connected\n      }\n    }\n  }\n"): typeof import('./graphql').BindAgentSkillConnectionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Tasks($first: Int, $after: String, $last: Int, $before: String) {\n    tasks(first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          agent {\n            id\n            name\n          }\n          title\n          message\n          createdAt\n          imageUrl(width: 200)\n          documents {\n            path\n            title\n            body\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n"): typeof import('./graphql').TasksDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Task($id: ID!) {\n    task(id: $id) {\n      id\n      agent {\n        id\n      }\n      title\n      message\n      createdAt\n      updatedAt\n      completedAt\n      imageUrl(width: 200)\n      artifacts\n      documents {\n        path\n        title\n        body\n      }\n    }\n  }\n"): typeof import('./graphql').TaskDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TaskLogs($taskId: ID!, $first: Int, $after: String, $last: Int, $before: String) {\n    taskLogs(taskId: $taskId, first: $first, after: $after, last: $last, before: $before) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          content\n          toolName\n          toolInput\n          toolResult\n          documents {\n            path\n            title\n            body\n          }\n          taskId\n          createdAt\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n"): typeof import('./graphql').TaskLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription TaskLogCreated($taskId: ID!) {\n    taskLogCreated(taskId: $taskId) {\n      id\n      role\n      content\n      toolName\n      toolInput\n      toolResult\n      documents {\n        path\n        title\n        body\n      }\n      taskId\n      createdAt\n    }\n  }\n"): typeof import('./graphql').TaskLogCreatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription TaskUpdated($taskId: ID!) {\n    taskUpdated(taskId: $taskId) {\n      id\n      title\n      message\n      updatedAt\n      completedAt\n      imageUrl(width: 200)\n      artifacts\n      documents {\n        path\n        title\n        body\n      }\n    }\n  }\n"): typeof import('./graphql').TaskUpdatedDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription SandboxOutput($taskId: ID!) {\n    sandboxOutput(taskId: $taskId) {\n      commandId\n      stream\n      data\n      done\n      exitCode\n    }\n  }\n"): typeof import('./graphql').SandboxOutputDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WorkspaceEntries($path: String!) {\n    workspaceEntries(path: $path) {\n      name\n      path\n      isDirectory\n      size\n      modifiedAt\n    }\n  }\n"): typeof import('./graphql').WorkspaceEntriesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WorkspaceFile($path: String!) {\n    workspaceFile(path: $path)\n  }\n"): typeof import('./graphql').WorkspaceFileDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
