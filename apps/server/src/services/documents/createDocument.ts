import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import type { DocumentItem } from "../../resources/ddb/schema/document.js";
import type { ServiceContext } from "../context.js";

export async function createDocument(
  ctx: ServiceContext,
  input: {
    title: string;
    body: string;
  },
): Promise<DocumentItem> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const item = {
    id,
    title: input.title,
    body: input.body,
    createdAt: now,
    updatedAt: now,
  };

  await ctx.resources.ddb.entities.Document.build(PutItemCommand).item(item).send();

  return item;
}
