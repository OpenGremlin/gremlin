import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { ServiceContext } from "../context.js";
import { providers } from "./providers.js";
import type { IntegrationResult } from "./getIntegrations.js";

export async function getIntegration(
  ctx: ServiceContext,
  id: string,
): Promise<IntegrationResult | null> {
  const provider = providers.find((p) => p.id === id);
  if (!provider) return null;

  const userId = ctx.user?.sub;
  if (!userId) throw new Error("Not authenticated");

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
}
