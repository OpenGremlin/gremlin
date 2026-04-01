/**
 * Mock response helpers for Apollo MockedProvider.
 * Each helper pairs a query/mutation with factory data.
 */
import type { MockedResponse } from "@apollo/client/testing";
import {
  AgentJobQuery,
  AgentJobsQuery,
  AgentQuery,
  AgentsQuery,
  GlobalSettingsQuery,
  ProfileQuery,
  SkillTemplatesQuery,
  UpdateAgentMutation,
} from "../graphql/queries";
import {
  buildAgent,
  buildAgentJob,
  buildGlobalSettings,
  buildProfile,
  buildSkillTemplate,
} from "./factories";

export function mockAgentsQuery(agents = [buildAgent()]): MockedResponse {
  return {
    request: { query: AgentsQuery },
    result: { data: { agents } },
  };
}

export function mockAgentQuery(
  id: string,
  agent = buildAgent({ id }),
): MockedResponse {
  return {
    request: { query: AgentQuery, variables: { id } },
    result: { data: { agent } },
  };
}

export function mockUpdateAgent(
  id: string,
  input: Record<string, unknown>,
  result = buildAgent({ id }),
): MockedResponse {
  return {
    request: { query: UpdateAgentMutation, variables: { id, input } },
    result: { data: { updateAgent: result } },
  };
}

export function mockProfileQuery(profile = buildProfile()): MockedResponse {
  return {
    request: { query: ProfileQuery },
    result: { data: { profile } },
  };
}

export function mockGlobalSettingsQuery(
  settings = buildGlobalSettings(),
): MockedResponse {
  return {
    request: { query: GlobalSettingsQuery },
    result: { data: { globalSettings: settings } },
  };
}

export function mockAgentJobsQuery(jobs = [buildAgentJob()]): MockedResponse {
  return {
    request: { query: AgentJobsQuery },
    result: { data: { agentJobs: jobs } },
  };
}

export function mockAgentJobQuery(
  id: string,
  job = buildAgentJob({ id }),
): MockedResponse {
  return {
    request: { query: AgentJobQuery, variables: { id } },
    result: { data: { agentJob: job } },
  };
}

export function mockSkillTemplatesQuery(
  templates = [buildSkillTemplate()],
): MockedResponse {
  return {
    request: { query: SkillTemplatesQuery },
    result: { data: { skillTemplates: templates } },
  };
}

export function mockAgentsQueryError(
  message = "Network error",
): MockedResponse {
  return {
    request: { query: AgentsQuery },
    error: new Error(message),
  };
}
