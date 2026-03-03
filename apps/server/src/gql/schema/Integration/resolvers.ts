import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const integrations: QueryResolvers["integrations"] = (_parent, _args, ctx) =>
  ctx.services.integrations.getIntegrations(ctx);

const integration: QueryResolvers["integration"] = (_parent, { id }, ctx) =>
  ctx.services.integrations.getIntegration(ctx, id);

const connectIntegration: MutationResolvers["connectIntegration"] = (
  _parent,
  { provider },
  ctx,
) => ctx.services.integrations.connectIntegration(ctx, provider);

const disconnectIntegration: MutationResolvers["disconnectIntegration"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.integrations.disconnectIntegration(ctx, id);

export const integrationResolvers = {
  Query: { integrations, integration },
  Mutation: { connectIntegration, disconnectIntegration },
};
