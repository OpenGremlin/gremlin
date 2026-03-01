import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const integrations: QueryResolvers["integrations"] = (_parent, _args, ctx) =>
  ctx.services.integrations.getIntegrations(ctx);

const integration: QueryResolvers["integration"] = (_parent, { id }, ctx) =>
  ctx.services.integrations.getIntegration(ctx, id);

const togglePermission: MutationResolvers["togglePermission"] = (
  _parent,
  { integrationId, scope, enabled },
  ctx,
) =>
  ctx.services.integrations.togglePermission(
    ctx,
    integrationId,
    scope,
    enabled,
  );

export const integrationResolvers = {
  Query: { integrations, integration },
  Mutation: { togglePermission },
};
