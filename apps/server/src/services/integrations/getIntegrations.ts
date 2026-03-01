import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { IntegrationItem } from "../../resources/ddb/schema/integration.js";
import type { ServiceContext } from "../context.js";

export async function getIntegrations(
  ctx: ServiceContext,
): Promise<IntegrationItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Integration)
    .query({ partition: "INTEGRATION" })
    .send();

  return Items ?? [];
}
