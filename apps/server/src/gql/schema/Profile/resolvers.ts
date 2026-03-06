import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const profile: QueryResolvers["profile"] = async (_parent, _args, ctx) => {
  const p = await ctx.services.profile.getProfile(ctx, "default");
  return (
    p ?? {
      name: "default",
      displayName: "",
      about: "",
      website: null,
      timezone: null,
    }
  );
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
