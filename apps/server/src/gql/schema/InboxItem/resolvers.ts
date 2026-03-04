import { filter, pipe } from "@graphql-yoga/subscription";
import type { InboxItemItem } from "../../../resources/ddb/schema/inboxItem.js";
import type { GremlinContext } from "../../context.js";
import type { QueryResolvers } from "../../resolverTypes.js";

const inboxItems: QueryResolvers["inboxItems"] = async (
  _parent,
  { agentId },
  ctx,
) => ctx.services.inbox.getUnreadItems(ctx, agentId);

const inboxItemCreated = {
  subscribe: (
    _parent: unknown,
    { agentId }: { agentId: string },
    ctx: GremlinContext,
  ) => {
    return pipe(
      ctx.resources.pubsub.subscribe(`inboxItemCreated:${agentId}`),
      filter((payload: InboxItemItem) => payload.agentId === agentId),
    );
  },
  resolve: (payload: InboxItemItem) => payload,
};

export const inboxItemResolvers = {
  Query: { inboxItems },
  Subscription: { inboxItemCreated },
};
