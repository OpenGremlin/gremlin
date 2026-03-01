import type { QueryResolvers } from "../../resolverTypes.js";

const document: QueryResolvers["document"] = (_parent, { id }, ctx) =>
  ctx.services.documents.getDocument(ctx, id);

export const documentResolvers = {
  Query: { document },
};
