import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { IntegrationItem } from "../../resources/ddb/schema/integration.js";
import type { ServiceContext } from "../context.js";
import { getIntegration } from "./getIntegration.js";

export async function togglePermission(
  ctx: ServiceContext,
  integrationId: string,
  scope: string,
  enabled: boolean,
): Promise<IntegrationItem> {
  const item = await getIntegration(ctx, integrationId);
  if (!item) throw new Error(`Integration ${integrationId} not found`);
  if (!item.permissions.some((p) => p.scope === scope)) {
    throw new Error(`Permission ${scope} not found`);
  }

  const permissions = item.permissions.map((p) =>
    p.scope === scope ? { ...p, enabled } : p,
  );

  const { Attributes } = await ctx.resources.ddb.entities.Integration.build(
    UpdateItemCommand,
  )
    .item({ id: integrationId, permissions })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Integration ${integrationId} not found`);
  return Attributes;
}
