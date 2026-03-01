import type { MutationResolvers, QueryResolvers } from "../../resolverTypes.js";

const skills: QueryResolvers["skills"] = (_parent, _args, ctx) =>
  ctx.services.skills.getSkills(ctx);

const skill: QueryResolvers["skill"] = (_parent, { id }, ctx) =>
  ctx.services.skills.getSkill(ctx, id);

const searchSkills: QueryResolvers["searchSkills"] = (_parent, { query }, ctx) =>
  ctx.services.skills.searchSkills(ctx, query);

const installSkill: MutationResolvers["installSkill"] = (_parent, { id }, ctx) =>
  ctx.services.skills.installSkill(ctx, id);

const uninstallSkill: MutationResolvers["uninstallSkill"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.skills.uninstallSkill(ctx, id);

export const skillResolvers = {
  Query: { skills, skill, searchSkills },
  Mutation: { installSkill, uninstallSkill },
};
