import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import type { DocumentItem } from "../../resources/ddb/schema/document.js";
import type { ServiceContext } from "../context.js";

export async function getDocument(
  ctx: ServiceContext,
  id: string,
): Promise<DocumentItem | null> {
  const { Items } = await ctx.resources.ddb.table
    .build(QueryCommand)
    .entities(ctx.resources.ddb.entities.Document)
    .query({ partition: "DOCUMENT", range: { eq: `DOCUMENT#${id}` } })
    .send();

  return Items?.[0] ?? null;
}
