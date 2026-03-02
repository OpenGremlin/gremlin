import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { IntegrationItem } from "../../resources/ddb/schema/integration.js";
import type { ServiceContext } from "../context.js";

export async function setIntegrationEnabled(
  ctx: ServiceContext,
  id: string,
  enabled: boolean,
): Promise<IntegrationItem> {
  const { Attributes } = await ctx.resources.ddb.entities.Integration.build(
    UpdateItemCommand,
  )
    .item({ id, enabled })
    .options({ returnValues: "ALL_NEW" })
    .send();

  if (!Attributes) throw new Error(`Integration ${id} not found`);
  return Attributes;
}
