import { filter, pipe, Repeater } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "@opengremlin/lib/resources/ddb/schema/agentLog.js";
import type { TaskItem } from "@opengremlin/lib/resources/ddb/schema/task.js";
import type { SandboxOutputEvent } from "@opengremlin/lib/resources/pubsub.js";
import type { GremlinContext } from "../../context.js";
import {
  TaskStatus,
  TaskType,
} from "../../resolverTypes.js";
import type {
  MutationResolvers,
  QueryResolvers,
  TaskEdgeResolvers,
  TaskResolvers,
} from "../../resolverTypes.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toTaskStatus = (raw?: string): TaskStatus => {
  switch (raw) {
    case "in_progress":
      return TaskStatus.InProgress;
    case "blocked":
      return TaskStatus.Blocked;
    case "closed":
      return TaskStatus.Closed;
    default:
      return TaskStatus.Open;
  }
};

const toTaskType = (raw?: string): TaskType => {
  switch (raw) {
    case "epic":
      return TaskType.Epic;
    case "bug":
      return TaskType.Bug;
    case "feature":
      return TaskType.Feature;
    default:
      return TaskType.Task;
  }
};

const statusToRaw: Record<string, string> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  BLOCKED: "blocked",
  CLOSED: "closed",
};

// ---------------------------------------------------------------------------
// Query resolvers
// ---------------------------------------------------------------------------

const tasks: QueryResolvers["tasks"] = (
  _parent,
  { first, after, last, before },
  ctx,
) => ctx.services.tasks.getAllTasks(ctx, { first, after, last, before });

const task: QueryResolvers["task"] = (_parent, { id }, ctx) =>
  ctx.services.tasks.getTask(ctx, id);

const agent: TaskResolvers["agent"] = async (parent, _args, ctx) => {
  if (!parent.agentId) return null;
  return ctx.loaders.agentLoader.load(parent.agentId).catch(() => null);
};

const emoji: TaskResolvers["emoji"] = (parent) => parent.emoji ?? null;

const attachments = (
  parent: { id: string },
  _args: unknown,
  ctx: GremlinContext,
) => ctx.services.tasks.getTaskAttachments(ctx, parent.id);

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

const status: TaskResolvers["status"] = (parent) =>
  toTaskStatus(parent.status);

const issueType: TaskResolvers["issueType"] = (parent) =>
  toTaskType(parent.issueType);

const children: TaskResolvers["children"] = async (parent, _args, ctx) => {
  if (parent.issueType !== "epic") return null;
  const kids = await ctx.services.tasks.getChildren(ctx, parent.id);
  return kids.length > 0 ? kids : null;
};

const latestComment: TaskResolvers["latestComment"] = async (
  parent,
  _args,
  ctx,
) => {
  const comment = await ctx.services.tasks.getLatestComment(ctx, parent.id);
  return comment?.text ?? null;
};

const assigneeName: TaskResolvers["assigneeName"] = async (
  parent,
  _args,
  ctx,
) => {
  const a = await ctx.loaders.agentLoader.load(parent.agentId);
  return a?.name ?? null;
};

// ---------------------------------------------------------------------------
// Mutation resolvers
// ---------------------------------------------------------------------------

const updateTaskStatusMutation: MutationResolvers["updateTaskStatus"] = async (
  _parent,
  { taskId, status: gqlStatus },
  ctx,
) => {
  const rawStatus = statusToRaw[gqlStatus] ?? "open";
  return ctx.services.tasks.updateTaskStatus(ctx, taskId, rawStatus);
};

const closeTaskMutation: MutationResolvers["closeTask"] = async (
  _parent,
  { taskId, reason },
  ctx,
) => ctx.services.tasks.closeTask(ctx, taskId, reason ?? undefined);

const addTaskCommentMutation: MutationResolvers["addTaskComment"] = async (
  _parent,
  { taskId, text },
  ctx,
) => {
  const author = ctx.user?.email ?? "unknown";
  await ctx.services.tasks.addComment(ctx, { taskId, author, text });
  // Return the updated task so the subscription fires with fresh data.
  const task = await ctx.services.tasks.getTask(ctx, taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  return task;
};

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
  Mutation: {
    updateTaskStatus: updateTaskStatusMutation,
    closeTask: closeTaskMutation,
    addTaskComment: addTaskCommentMutation,
  },
  Task: {
    agent,
    emoji,
    status,
    issueType,
    children,
    latestComment,
    assigneeName,
    attachments,
    logs,
  },
  TaskEdge: { node },
  Subscription: {
    taskUpdated,
    tasksUpdated,
    jobTaskCreated,
    taskLogCreated,
    sandboxOutput,
  },
};
