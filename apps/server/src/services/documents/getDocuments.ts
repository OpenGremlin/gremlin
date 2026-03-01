import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { DocumentItem } from "../../resources/ddb/schema/document.js";
import type { ServiceContext } from "../context.js";

export async function getDocuments(
  ctx: ServiceContext,
): Promise<DocumentItem[]> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Document)
    .query({ partition: "DOCUMENT" })
    .send();

  return Items ?? [];
}
