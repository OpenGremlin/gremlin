import { filter, pipe, Repeater } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "../../../resources/ddb/schema/agentLog.js";
import type { SandboxOutputEvent } from "../../../resources/pubsub.js";
import type { TaskItem } from "../../../resources/ddb/schema/task.js";
import { readFile } from "../../../services/workspace/readFile.js";
import type { GremlinContext } from "../../context.js";
import type {
  QueryResolvers,
  TaskEdgeResolvers,
  TaskResolvers,
} from "../../resolverTypes.js";

function parseFrontmatter(content: string): { title: string; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { title: "", body: content };
  const frontmatter = match[1];
  const body = match[2];
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
  return { title: titleMatch?.[1]?.trim() ?? "", body };
}

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
        ctx.mediaCdnUrl,
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
  Task: { agent, imageUrl, artifacts, documents, logs },
  TaskEdge: { node },
  Subscription: { taskUpdated, tasksUpdated, taskLogCreated, sandboxOutput },
};
