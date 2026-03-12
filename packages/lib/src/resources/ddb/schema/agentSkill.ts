import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * Stores the assignment of a skill to an agent, along with connection bindings.
 *
 * pk: AGENT#<agentId>
 * sk: AGENT_SKILL#<skillId>
 */
export const AgentSkillEntity = new Entity({
  name: "AgentSkill",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    agentId: string().key(),
    skillId: string().key(),
    /** JSON string mapping providerId → connectionId, e.g. '{"github":"conn-123"}' */
    connectionBindings: anyOf(string(), nul()),
    /** ISO timestamp of when the skill was assigned */
    assignedAt: string(),
  }),
  computeKey: ({ agentId, skillId }) => ({
    pk: `AGENT#${agentId}`,
    sk: `AGENT_SKILL#${skillId}`,
  }),
});

export type AgentSkillItem = FormattedItem<typeof AgentSkillEntity>;
