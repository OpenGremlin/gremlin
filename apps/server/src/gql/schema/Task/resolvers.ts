import { filter, pipe, Repeater } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "@opengremlin/lib/resources/ddb/schema/agentLog.js";
import type { TaskItem } from "@opengremlin/lib/resources/ddb/schema/task.js";
import type { SandboxOutputEvent } from "@opengremlin/lib/resources/pubsub.js";
import type { GremlinContext } from "../../context.js";
import type {
  QueryResolvers,
  TaskEdgeResolvers,
  TaskResolvers,
} from "../../resolverTypes.js";

const tasks: QueryResolvers["tasks"] = (
  _parent,
  { first, after, last, before },
  ctx,
) => ctx.services.tasks.getAllTasks(ctx, { first, after, last, before });

const task: QueryResolvers["task"] = (_parent, { id }, ctx) =>
  ctx.services.tasks.getTask(ctx, id);

const agent: TaskResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.loaders.agentLoader.load(parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

const emoji: TaskResolvers["emoji"] = (parent) => parent.emoji ?? null;

// biome-ignore lint/suspicious/noExplicitAny: attachments field not in generated types yet
const attachments = (parent: any) => parent.attachments ?? [];

const logs: TaskResolvers["logs"] = (
  parent,
  { first, after, last, before },
  ctx,
) =>
  ctx.services.agentLogs.getTaskLogs(ctx, parent.id, {
    first,
    after,
    last,
    before,
  });

const node: TaskEdgeResolvers["node"] = (parent) => parent.node;

const taskUpdated = {
  subscribe: (
    _parent: unknown,
    { taskId }: { taskId: string },
    ctx: GremlinContext,
  ) => ctx.resources.pubsub.subscribe(`taskUpdated:${taskId}`),
  resolve: (payload: TaskItem) => payload,
};

const tasksUpdated = {
  subscribe: (
    _parent: unknown,
    { taskIds }: { taskIds: string[] },
    ctx: GremlinContext,
  ) =>
    Repeater.merge(
      taskIds.map((id) => ctx.resources.pubsub.subscribe(`taskUpdated:${id}`)),
    ),
  resolve: (payload: TaskItem) => payload,
};

const jobTaskCreated = {
  subscribe: (
    _parent: unknown,
    { jobId }: { jobId: string },
    ctx: GremlinContext,
  ) => ctx.resources.pubsub.subscribe(`jobTaskCreated:${jobId}`),
  resolve: (payload: TaskItem) => payload,
};

const taskLogCreated = {
  subscribe: (
    _parent: unknown,
    { taskId }: { taskId: string },
    ctx: GremlinContext,
  ) =>
    pipe(
      ctx.resources.pubsub.subscribe(`agentLogCreated:task:${taskId}`),
      filter((payload: AgentLogItem) => !payload.internal),
    ),
  resolve: (payload: AgentLogItem) => payload,
};

const sandboxOutput = {
  subscribe: (
    _parent: unknown,
    { taskId }: { taskId: string },
    ctx: GremlinContext,
  ) => ctx.resources.pubsub.subscribe(`sandboxOutput:${taskId}`),
  resolve: (payload: SandboxOutputEvent) => payload,
};

export const taskResolvers = {
  Query: { tasks, task },
  Task: { agent, emoji, attachments, logs },
  TaskEdge: { node },
  Subscription: {
    taskUpdated,
    tasksUpdated,
    jobTaskCreated,
    taskLogCreated,
    sandboxOutput,
  },
};
