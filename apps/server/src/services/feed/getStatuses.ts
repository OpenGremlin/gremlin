import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { StatusItem } from "../../resources/ddb/schema/status.js";
import type { ServiceContext } from "../context.js";

export async function getStatuses(
  ctx: ServiceContext,
): Promise<StatusItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Status)
    .query({ partition: "STATUS" })
    .send();

  return Items ?? [];
}
