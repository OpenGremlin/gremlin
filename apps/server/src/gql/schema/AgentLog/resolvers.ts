import { filter, pipe } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "@gremlin/lib/resources/ddb/schema/agentLog.js";
import type { GremlinContext } from "../../context.js";
import type {
  AgentLogEdgeResolvers,
  AgentLogResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const agentLogs: QueryResolvers["agentLogs"] = (
  _parent,
  { agentId, first, after, last, before },
  ctx,
) =>
  ctx.services.agentLogs.getAgentLogs(ctx, agentId, {
    first,
    after,
    last,
    before,
  });

const taskLogs: QueryResolvers["taskLogs"] = (
  _parent,
  { taskId, first, after, last, before },
  ctx,
) =>
  ctx.services.agentLogs.getTaskLogs(ctx, taskId, {
    first,
    after,
    last,
    before,
  });

const agent: AgentLogResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.loaders.agentLoader.load(parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

const node: AgentLogEdgeResolvers["node"] = (parent) => parent.node;

const sendMessage = async (
  _parent: unknown,
  {
    agentId,
    content,
    taskId,
  }: { agentId: string; content: string; taskId?: string | null },
  ctx: GremlinContext,
) => {
  await ctx.services.orchestrator.sendMessage(ctx, agentId, content, taskId);
  return { queued: true, content };
};

const agentLogCreated = {
  subscribe: (
    _parent: unknown,
    { agentId }: { agentId: string },
    ctx: GremlinContext,
  ) => {
    return pipe(
      ctx.resources.pubsub.subscribe(`agentLogCreated:${agentId}`),
      filter(
        (payload: AgentLogItem) =>
          payload.agentId === agentId && !payload.internal,
      ),
    );
  },
  resolve: (payload: AgentLogItem) => payload,
};

export const agentLogResolvers = {
  Query: { agentLogs, taskLogs },
  Mutation: { sendMessage },
  Subscription: { agentLogCreated },
  AgentLog: { agent },
  AgentLogEdge: { node },
};
