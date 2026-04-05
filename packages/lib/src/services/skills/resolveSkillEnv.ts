import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import { createLogger } from "../../logger.js";
import type { IntegrationConnectionItem } from "../../resources/ddb/schema/integrationConnection.js";
import type { Resources } from "../../resources/index.js";
import { getAccessTokenForConnection } from "../oauth/getAccessToken.js";
import { parseConnectionBindings } from "./parseConnectionBindings.js";
import type { SkillConnectionRequirement, SkillTemplate } from "./registry.js";

const log = createLogger("skills:env");

export interface ResolvedSkillEnv {
  env: Record<string, string>;
  missing: string[];
  errors: string[];
}

/**
 * Resolve env vars for a single connection requirement using a specific connectionId.
 */
export async function resolveConnectionEnv(
  resources: Resources,
  req: SkillConnectionRequirement,
  connectionId: string,
): Promise<Record<string, string>> {
  const env: Record<string, string> = {};

  // Load connection by ID
  const { Items = [] } = await resources.ddb.secretsTable
    .build(QueryCommand)
    .entities(resources.ddb.entities.IntegrationConnection)
    .query({ partition: "INTEGRATION_CONNECTION" })
    .send();

  const connection = (Items as IntegrationConnectionItem[]).find(
    (c) => c.id === connectionId,
  );
  if (!connection || connection.isRevoked) {
    log.warn(
      { connectionId, found: !!connection, revoked: connection?.isRevoked },
      "Connection not found or revoked",
    );
    return env;
  }

  log.info(
    {
      connectionId,
      provider: req.provider,
      connectionType: connection.connectionType,
      envVars: Object.keys(req.env),
    },
    "Resolving connection env",
  );

  if (connection.connectionType === "oauth") {
    try {
      const token = await getAccessTokenForConnection(resources, connectionId);
      for (const [envVar] of Object.entries(req.env)) {
        env[envVar] = token;
      }
    } catch {
      // token unavailable
    }
    return env;
  }

  if (connection.connectionType === "aws_iam_role") {
    const roleArn = connection.connectionMeta.roleArn;
    if (!roleArn) {
      log.warn({ connectionId }, "aws_iam_role connection has no roleArn");
      return env;
    }

    log.info({ connectionId, roleArn }, "Attempting STS AssumeRole");

    try {
      const sts = new STSClient({});
      const response = await sts.send(
        new AssumeRoleCommand({
          RoleArn: roleArn,
          RoleSessionName: `gremlin-${Date.now()}`,
          DurationSeconds: 3600,
        }),
      );

      const creds = response.Credentials;
      if (creds?.AccessKeyId && creds?.SecretAccessKey && creds?.SessionToken) {
        env.AWS_ACCESS_KEY_ID = creds.AccessKeyId;
        env.AWS_SECRET_ACCESS_KEY = creds.SecretAccessKey;
        env.AWS_SESSION_TOKEN = creds.SessionToken;
        if (connection.connectionMeta.roleRegion) {
          env.AWS_DEFAULT_REGION = connection.connectionMeta.roleRegion;
        }
        log.info(
          {
            connectionId,
            roleArn,
            region: env.AWS_DEFAULT_REGION ?? "default",
          },
          "AssumeRole succeeded, credentials set",
        );
      } else {
        log.error(
          {
            connectionId,
            roleArn,
            hasAccessKey: !!creds?.AccessKeyId,
            hasSecret: !!creds?.SecretAccessKey,
            hasToken: !!creds?.SessionToken,
          },
          "AssumeRole returned incomplete credentials",
        );
        throw new Error(
          `AssumeRole for ${roleArn} returned incomplete credentials`,
        );
      }
    } catch (err) {
      log.error(
        {
          connectionId,
          roleArn,
          error: (err as Error).message,
          errorName: (err as Error).name,
        },
        "AssumeRole failed",
      );
      throw err;
    }
    return env;
  }

  // API key / other connections — read from connectionMeta
  const meta = connection.connectionMeta;
  for (const [envVar, metaField] of Object.entries(req.env)) {
    const value = meta[metaField as keyof typeof meta];
    if (value) {
      env[envVar] = value;
    }
  }

  return env;
}

/**
 * Resolve a skill's full environment by merging connection tokens
 * into the environment variables specified by the skill's connections.
 * Uses the first bound connection for each provider.
 */
export async function resolveSkillEnv(
  resources: Resources,
  skillDef: SkillTemplate,
  connectionBindingsRaw: string | null | undefined,
): Promise<ResolvedSkillEnv> {
  const env: Record<string, string> = {};
  const missing: string[] = [];
  const errors: string[] = [];

  if (!skillDef.connections?.length) {
    return { env, missing, errors };
  }

  const bindings = parseConnectionBindings(connectionBindingsRaw);

  for (const req of skillDef.connections) {
    const boundIds = bindings[req.provider];

    if (!boundIds || boundIds.length === 0) {
      if (!req.optional) {
        missing.push(req.provider);
      }
      continue;
    }

    try {
      const resolved = await resolveConnectionEnv(resources, req, boundIds[0]);
      if (Object.keys(resolved).length === 0 && !req.optional) {
        missing.push(req.provider);
      } else {
        Object.assign(env, resolved);
      }
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      if (!req.optional) {
        missing.push(req.provider);
      }
      errors.push(`${req.provider}: ${message}`);
    }
  }

  return { env, missing, errors };
}
