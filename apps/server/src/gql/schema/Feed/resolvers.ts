import type { QueryResolvers } from "../../resolverTypes.js";

const feed: QueryResolvers["feed"] = async (_parent, _args, ctx) => {
  const tasks = await ctx.services.tasks.getAllTasks(ctx);
  return tasks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const feedResolvers = {
  Query: { feed },
};
