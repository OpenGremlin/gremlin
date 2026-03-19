import { filter, pipe, Repeater } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "@gremlin/lib/resources/ddb/schema/agentLog.js";
import type { TaskItem } from "@gremlin/lib/resources/ddb/schema/task.js";
import type { SandboxOutputEvent } from "@gremlin/lib/resources/pubsub.js";
import { getFileInfo } from "@gremlin/lib/services/workspace/getFileInfo.js";
import { readFile } from "@gremlin/lib/services/workspace/readFile.js";
import type { GremlinContext } from "../../context.js";
import type {
  QueryResolvers,
  TaskEdgeResolvers,
  TaskResolvers,
} from "../../resolverTypes.js";
import { parseFrontmatter } from "../shared/parseFrontmatter.js";

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

const imageUrl: TaskResolvers["imageUrl"] = (parent, args, ctx) =>
  parent.image
    ? ctx.services.media.buildMediaUrl(
        ctx.mediaBaseUrl,
        `tasks/${parent.image}`,
        args.width,
      )
    : null;

const artifacts: TaskResolvers["artifacts"] = (parent) =>
  parent.artifacts ?? [];

const documents: TaskResolvers["documents"] = async (parent) => {
  const paths = parent.artifacts ?? [];
  const results = await Promise.all(
    paths.map(async (filePath: string) => {
      try {
        const content = await readFile(filePath);
        if (!content) return null;
        const { title, body } = parseFrontmatter(content);
        return { path: filePath, title: title || filePath, body };
      } catch {
        return null;
      }
    }),
  );
  return results.filter((d): d is NonNullable<typeof d> => d != null);
};

// biome-ignore lint/suspicious/noExplicitAny: files field not in generated types yet
const files = async (parent: any, _args: unknown, ctx: GremlinContext) => {
  const paths = (parent.artifacts as string[] | undefined) ?? [];
  if (paths.length === 0) return [];
  const serverBase = ctx.serverBaseUrl;
  const results = await Promise.all(
    paths.map(async (filePath: string) => {
      try {
        const info = await getFileInfo(filePath);
        if (!info) return null;
        return { ...info, _serverBase: serverBase };
      } catch {
        return null;
      }
    }),
  );
  return results.filter((f): f is NonNullable<typeof f> => f != null);
};

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
  Task: { agent, imageUrl, artifacts, documents, files, logs },
  TaskEdge: { node },
  Subscription: {
    taskUpdated,
    tasksUpdated,
    jobTaskCreated,
    taskLogCreated,
    sandboxOutput,
  },
};
