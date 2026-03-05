import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { SkillItem } from "../../resources/ddb/schema/skill.js";
import type { Resources } from "../../resources/index.js";
import { getAccessToken } from "../oauth/getAccessToken.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import type { SkillDef } from "./registry.js";

export interface ResolvedSkillEnv {
  env: Record<string, string>;
  missing: string[];
}

/**
 * Resolve a skill's full environment by merging:
 * 1. Static env from the SkillDef
 * 2. User configOverrides
 * 3. Tokens/keys from bound IntegrationConnections via envMapping
 */
export async function resolveSkillEnv(
  resources: Resources,
  skillDef: SkillDef,
  skillItem: SkillItem,
): Promise<ResolvedSkillEnv> {
  // 1. Start with static env from the skill definition
  const env: Record<string, string> = { ...(skillDef.mcp?.env ?? {}) };
  const missing: string[] = [];

  // 2. Apply user config overrides
  if (skillItem.configOverrides) {
    try {
      const overrides = JSON.parse(skillItem.configOverrides) as {
        env?: Record<string, string>;
      };
      if (overrides.env) {
        Object.assign(env, overrides.env);
      }
    } catch {
      // Ignore malformed configOverrides
    }
  }

  // 3. Resolve connection bindings
  if (!skillDef.requiredConnections?.length) {
    return { env, missing };
  }

  const bindings = parseConnectionBindings(skillItem.connectionBindings);

  // Load all connections once for lookups
  const { Items: allConnections = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  const connectionMap = new Map(
    (allConnections as IntegrationConnectionItem[]).map((c) => [c.id, c]),
  );

  for (const req of skillDef.requiredConnections) {
    const boundConnectionId = bindings[req.providerId];

    if (!boundConnectionId) {
      if (!req.optional) {
        missing.push(req.providerId);
      }
      continue;
    }

    const connection = connectionMap.get(boundConnectionId);
    if (!connection || connection.isRevoked) {
      if (!req.optional) {
        missing.push(req.providerId);
      }
      continue;
    }

    // For OAuth connections, use getAccessToken to handle refresh
    if (connection.connectionType === "oauth") {
      try {
        const token = await getAccessToken(
          resources,
          req.providerId,
          "_system",
        );
        for (const [envVar, _metaField] of Object.entries(req.envMapping)) {
          env[envVar] = token;
        }
      } catch {
        if (!req.optional) {
          missing.push(req.providerId);
        }
      }
      continue;
    }

    // For API key / other connections, read directly from connectionMeta
    const meta = connection.connectionMeta;
    for (const [envVar, metaField] of Object.entries(req.envMapping)) {
      const value = meta[metaField as keyof typeof meta];
      if (value) {
        env[envVar] = value;
      } else if (!req.optional) {
        missing.push(req.providerId);
      }
    }
  }

  return { env, missing };
}
