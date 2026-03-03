import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type {
  IntegrationResolvers,
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const integrations: QueryResolvers["integrations"] = (_parent, _args, ctx) =>
  ctx.services.integrations.getIntegrations();

const integration: QueryResolvers["integration"] = (_parent, { id }, ctx) =>
  ctx.services.integrations.getIntegration(id);

const connected: IntegrationResolvers["connected"] = async (parent, _args, ctx) => {
  const userId = ctx.user?.sub;
  if (!userId) return false;
  const { Item } = await ctx.resources.ddb.entities.OAuthToken.build(GetItemCommand)
    .key({ userId, provider: parent.id })
    .send();
  return !!Item;
};

const account: IntegrationResolvers["account"] = async (parent, _args, ctx) => {
  const userId = ctx.user?.sub;
  if (!userId) return null;
  const { Item } = await ctx.resources.ddb.entities.OAuthToken.build(GetItemCommand)
    .key({ userId, provider: parent.id })
    .send();
  return Item?.email ?? null;
};

const connectedAt: IntegrationResolvers["connectedAt"] = async (parent, _args, ctx) => {
  const userId = ctx.user?.sub;
  if (!userId) return null;
  const { Item } = await ctx.resources.ddb.entities.OAuthToken.build(GetItemCommand)
    .key({ userId, provider: parent.id })
    .send();
  return Item?.connectedAt ?? null;
};

const permissions: IntegrationResolvers["permissions"] = (parent) =>
  parent.scopes.map((s) => ({ scope: s.scope, label: s.label }));

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
  Integration: { connected, account, connectedAt, permissions },
};
