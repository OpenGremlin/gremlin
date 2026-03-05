import { Entity, type FormattedItem } from "dynamodb-toolbox/entity";
import { anyOf } from "dynamodb-toolbox/schema/anyOf";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { item } from "dynamodb-toolbox/schema/item";
import { nul } from "dynamodb-toolbox/schema/nul";
import { string } from "dynamodb-toolbox/schema/string";
import { GremlinTable } from "../table.js";

/**
 * Persists only mutable user state for a skill.
 * Static metadata (name, description, version, etc.) lives in the skill catalog.
 */
export const SkillEntity = new Entity({
  name: "Skill",
  table: GremlinTable,
  timestamps: false,
  schema: item({
    id: string().key(),
    /** References SkillTemplate.id from the catalog */
    templateId: string(),
    installed: boolean(),
    /** ISO timestamp of when the skill was installed */
    installedAt: anyOf(string(), nul()),
    /** JSON string mapping providerId → connectionId, e.g. '{"github":"conn-123"}' */
    connectionBindings: anyOf(string(), nul()),
    /** Whether MCP tools are enabled (can toggle without uninstalling) */
    mcpEnabled: anyOf(boolean(), nul()),
    /** JSON string for user-level config overrides */
    configOverrides: anyOf(string(), nul()),
  }),
  computeKey: ({ id }) => ({
    pk: "SKILL",
    sk: `SKILL#${id}`,
  }),
});

export type SkillItem = FormattedItem<typeof SkillEntity>;
