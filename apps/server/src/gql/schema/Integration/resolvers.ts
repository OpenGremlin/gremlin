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

const setIntegrationEnabled: MutationResolvers["setIntegrationEnabled"] = (
  _parent,
  { id, enabled },
  ctx,
) => ctx.services.integrations.setIntegrationEnabled(ctx, id, enabled);

const disconnectIntegration: MutationResolvers["disconnectIntegration"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.integrations.disconnectIntegration(ctx, id);

const connectGoogle: MutationResolvers["connectGoogle"] = (_parent, _args, ctx) =>
  ctx.services.google.generateGoogleAuthUrl(ctx);

export const integrationResolvers = {
  Query: { integrations, integration },
  Mutation: { togglePermission, setIntegrationEnabled, disconnectIntegration, connectGoogle },
};
