import { Repeater } from "@graphql-yoga/subscription";
import type { DocumentItem } from "../../../resources/ddb/schema/document.js";
import type { GremlinContext } from "../../context.js";
import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const documents: QueryResolvers["documents"] = (_parent, _args, ctx) =>
  ctx.services.documents.getDocuments(ctx);

const document: QueryResolvers["document"] = (_parent, { id }, ctx) =>
  ctx.services.documents.getDocument(ctx, id);

const createDocument: MutationResolvers["createDocument"] = (
  _parent,
  { input },
  ctx,
) => ctx.services.documents.createDocument(ctx, input);

const updateDocument: MutationResolvers["updateDocument"] = (
  _parent,
  { id, input },
  ctx,
) => ctx.services.documents.updateDocument(ctx, id, input);

const documentUpdated = {
  subscribe: (_parent: unknown, { id }: { id: string }, ctx: GremlinContext) =>
    ctx.resources.pubsub.subscribe(`documentUpdated:${id}`),
  resolve: (payload: DocumentItem) => payload,
};

const documentsUpdated = {
  subscribe: (
    _parent: unknown,
    { documentIds }: { documentIds: string[] },
    ctx: GremlinContext,
  ) =>
    Repeater.merge(
      documentIds.map((id) =>
        ctx.resources.pubsub.subscribe(`documentUpdated:${id}`),
      ),
    ),
  resolve: (payload: DocumentItem) => payload,
};

export const documentResolvers = {
  Query: { documents, document },
  Mutation: { createDocument, updateDocument },
  Subscription: { documentUpdated, documentsUpdated },
};
