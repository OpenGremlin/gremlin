import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { AgentSkillItem } from "../../resources/ddb/schema/agentSkill.js";
import type { ServiceContext } from "../context.js";

/**
 * Returns all skills assigned to a specific agent.
 */
export async function getAgentSkills(
  ctx: ServiceContext,
  agentId: string,
): Promise<AgentSkillItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.AgentSkill)
    .query({
      partition: `AGENT#${agentId}`,
      range: { gte: "AGENT_SKILL#" },
    })
    .send();

  return (Items ?? []) as AgentSkillItem[];
}
