import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { ServiceContext } from "../context.js";
import { providers } from "./providers.js";

export interface IntegrationResult {
  id: string;
  service: string;
  description: string;
  connected: boolean;
  account: string | null;
  connectedAt: string | null;
  permissions: { scope: string; label: string }[];
}

export async function getIntegrations(
  ctx: ServiceContext,
): Promise<IntegrationResult[]> {
  const userId = ctx.user?.sub;
  if (!userId) throw new Error("Not authenticated");

  const results = await Promise.all(
    providers.map(async (provider) => {
      const { Item } = await ctx.resources.ddb.entities.OAuthToken.build(
        GetItemCommand,
      )
        .key({ userId, provider: provider.id })
        .send();

      return {
        id: provider.id,
        service: provider.service,
        description: provider.description,
        connected: !!Item,
        account: Item?.email ?? null,
        connectedAt: Item?.connectedAt ?? null,
        permissions: provider.scopes.map((s) => ({
          scope: s.scope,
          label: s.label,
        })),
      };
    }),
  );

  return results;
}
