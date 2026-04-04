import { useQuery } from "@apollo/client";
import { AgentQuery } from "../graphql/queries";

/** Returns true if the agent has speech enabled and a speech model configured. */
export function useSpeechAvailable(agentId: string): boolean {
  const { data } = useQuery(AgentQuery, { variables: { id: agentId } });
  const config = data?.agent?.config;
  return !!config?.speech?.enabled;
}
