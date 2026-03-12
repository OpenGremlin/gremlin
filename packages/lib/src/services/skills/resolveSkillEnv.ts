import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { Resources } from "../../resources/index.js";
import { getAccessToken } from "../oauth/getAccessToken.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import type { SkillTemplate } from "./registry.js";

export interface ResolvedSkillEnv {
  env: Record<string, string>;
  missing: string[];
}

/**
 * Resolve a skill's full environment by merging connection tokens
 * into the environment variables specified by the skill's connections.
 */
export async function resolveSkillEnv(
  resources: Resources,
  skillDef: SkillTemplate,
  connectionBindingsRaw: string | null | undefined,
): Promise<ResolvedSkillEnv> {
  const env: Record<string, string> = {};
  const missing: string[] = [];

  if (!skillDef.connections?.length) {
    return { env, missing };
  }

  const bindings = parseConnectionBindings(connectionBindingsRaw);

  // Load all connections once for lookups
  const { Items: allConnections = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  const connectionMap = new Map(
    (allConnections as IntegrationConnectionItem[]).map((c) => [c.id, c]),
  );

  for (const req of skillDef.connections) {
    const boundConnectionId = bindings[req.provider];

    if (!boundConnectionId) {
      if (!req.optional) {
        missing.push(req.provider);
      }
      continue;
    }

    const connection = connectionMap.get(boundConnectionId);
    if (!connection || connection.isRevoked) {
      if (!req.optional) {
        missing.push(req.provider);
      }
      continue;
    }

    // For OAuth connections, use getAccessToken to handle refresh
    if (connection.connectionType === "oauth") {
      try {
        const token = await getAccessToken(resources, req.provider, "_system");
        for (const [envVar] of Object.entries(req.env)) {
          env[envVar] = token;
        }
      } catch {
        if (!req.optional) {
          missing.push(req.provider);
        }
      }
      continue;
    }

    // For API key / other connections, read directly from connectionMeta
    const meta = connection.connectionMeta;
    for (const [envVar, metaField] of Object.entries(req.env)) {
      const value = meta[metaField as keyof typeof meta];
      if (value) {
        env[envVar] = value;
      } else if (!req.optional) {
        missing.push(req.provider);
      }
    }
  }

  return { env, missing };
}
