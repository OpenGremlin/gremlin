import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { IntegrationItem } from "../../resources/ddb/schema/integration.js";
import type { ServiceContext } from "../context.js";

export async function getIntegration(
  ctx: ServiceContext,
  id: string,
): Promise<IntegrationItem | null> {
  const { Item } = await ctx.resources.ddb.entities.Integration.build(
    GetItemCommand,
  )
    .key({ id })
    .send();

  return Item ?? null;
}
