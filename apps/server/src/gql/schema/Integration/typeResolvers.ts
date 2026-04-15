import type { SafeIntegrationConnection } from "@opengremlin/lib/services/integrations/getConnections.js";
import type {
  IntegrationConnectionResolvers,
  IntegrationProviderResolvers,
} from "../../resolverTypes.js";
import { getConnectionsCached } from "./connectionsCache.js";

export const connectionCount: IntegrationProviderResolvers["connectionCount"] =
  async (parent, _args, ctx) => {
    const connections = await getConnectionsCached(ctx);
    return connections.filter((c) => c.providerId === parent.id).length;
  };

export const hasConnection: IntegrationProviderResolvers["hasConnection"] =
  async (parent, _args, ctx) => {
    // Bedrock uses server-side AWS credentials — always connected
    if (parent.connectionType === "bedrock") return true;
    const connections = await getConnectionsCached(ctx);
    return connections.some((c) => c.providerId === parent.id);
  };

export const provider: IntegrationConnectionResolvers["provider"] = (
  parent,
  _args,
  ctx,
) => {
  const match = ctx.services.integrations
    .getIntegrations()
    .find((p) => p.id === parent.providerId);
  if (!match) throw new Error(`Unknown provider: ${parent.providerId}`);
  return match;
};

export const meta: IntegrationConnectionResolvers["meta"] = (parent) => {
  const conn = parent as unknown as SafeIntegrationConnection;
  if (conn.connectionType === "oauth") {
    return {
      __typename: "OAuthConnectionMeta" as const,
      accountId: conn.connectionMeta.accountId ?? null,
      scopes: conn.connectionMeta.scopes?.split(",").filter(Boolean) ?? [],
      expiresAt: conn.connectionMeta.expiresAt ?? null,
    };
  }
  if (conn.connectionType === "aws_iam_role") {
    return {
      __typename: "AwsIamRoleConnectionMeta" as const,
      accountId: conn.connectionMeta.accountId ?? null,
      roleArn: conn.connectionMeta.roleArn ?? "",
      region: conn.connectionMeta.roleRegion ?? null,
      displayName: conn.connectionMeta.displayName ?? null,
    };
  }
  return {
    __typename: "ApiKeyConnectionMeta" as const,
    accountId: conn.connectionMeta.accountId ?? null,
  };
};
