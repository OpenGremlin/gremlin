import type {
  MutationResolvers,
  NotificationResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const notifications: QueryResolvers["notifications"] = (_parent, _args, ctx) =>
  ctx.services.notifications.getNotifications(ctx);

const resolveNotification: MutationResolvers["resolveNotification"] = (
  _parent,
  { id, action },
  ctx,
) => ctx.services.notifications.resolveNotification(ctx, id, action);

const dismissNotification: MutationResolvers["dismissNotification"] = (
  _parent,
  { id },
  ctx,
) => ctx.services.notifications.dismissNotification(ctx, id);

const agent: NotificationResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.loaders.agentLoader.load(parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

export const notificationResolvers = {
  Query: { notifications },
  Mutation: { resolveNotification, dismissNotification },
  Notification: { agent },
};
