import type {
  MutationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const modelProviders: QueryResolvers["modelProviders"] = (_parent, _args, ctx) =>
  ctx.services.modelProviders.getModelProviders(ctx);

const activeModel: QueryResolvers["activeModel"] = (_parent, _args, ctx) =>
  ctx.services.modelProviders.getActiveModel(ctx);

const setProviderApiKey: MutationResolvers["setProviderApiKey"] = async (
  _parent,
  { providerId, apiKey },
  ctx,
) => {
  await ctx.services.modelProviders.setProviderApiKey(ctx, providerId, apiKey);
  return true;
};

const removeProviderApiKey: MutationResolvers["removeProviderApiKey"] = async (
  _parent,
  { providerId },
  ctx,
) => {
  await ctx.services.modelProviders.removeProviderApiKey(ctx, providerId);
  return true;
};

const setActiveModel: MutationResolvers["setActiveModel"] = async (
  _parent,
  { providerId, modelId },
  ctx,
) => {
  await ctx.services.modelProviders.setActiveModel(ctx, providerId, modelId);
  return true;
};

export const modelProviderResolvers = {
  Query: { modelProviders, activeModel },
  Mutation: { setProviderApiKey, removeProviderApiKey, setActiveModel },
};
