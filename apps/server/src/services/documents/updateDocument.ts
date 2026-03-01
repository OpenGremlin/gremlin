import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import type { DocumentItem } from "../../resources/ddb/schema/document.js";
import type { ServiceContext } from "../context.js";

export async function updateDocument(
  ctx: ServiceContext,
  id: string,
  input: {
    title: string;
    body: string;
  },
): Promise<DocumentItem> {
  const now = new Date().toISOString();

  const doc = await ctx.services.documents.getDocument(ctx, id);
  if (!doc) throw new Error(`Document ${id} not found`);

  await ctx.resources.ddb.entities.Document.build(UpdateItemCommand)
    .item({
      id,
      createdAt: doc.createdAt,
      title: input.title,
      body: input.body,
      updatedAt: now,
    })
    .options({ returnValues: "NONE" })
    .send();

  const updated = {
    ...doc,
    title: input.title,
    body: input.body,
    updatedAt: now,
  };

  ctx.resources.pubsub.publish(`documentUpdated:${id}`, updated);

  return updated;
}
