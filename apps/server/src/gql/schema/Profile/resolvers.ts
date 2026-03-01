import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const profile: QueryResolvers["profile"] = async (_parent, _args, ctx) => {
  const p = await ctx.services.profile.getProfile(ctx, "default");
  if (!p) throw new Error("Profile not found");
  return p;
};

const updateProfile: MutationResolvers["updateProfile"] = (
  _parent,
  { input },
  ctx,
) => ctx.services.profile.updateProfile(ctx, { ...input, name: "default" });

export const profileResolvers = {
  Query: { profile },
  Mutation: { updateProfile },
};
