import { filter, pipe } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "@gremlin/lib/resources/ddb/schema/agentLog.js";
import { readFile } from "@gremlin/lib/services/workspace/readFile.js";
import type { GremlinContext } from "../../context.js";
import type {
  AgentLogEdgeResolvers,
  AgentLogResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";
import { parseFrontmatter } from "../shared/parseFrontmatter.js";
import { extractFilePaths } from "../shared/resolveAttachments.js";
import { resolveFiles } from "../shared/resolveFiles.js";

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

// biome-ignore lint/suspicious/noExplicitAny: attachments field not in generated types yet
const attachments = (parent: any) => parent.attachments ?? [];

const documents: AgentLogResolvers["documents"] = async (parent) => {
  // biome-ignore lint/suspicious/noExplicitAny: attachments field not in generated types yet
  const paths = extractFilePaths((parent as any).attachments);
  if (paths.length === 0) return [];
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
const files = async (parent: any, _args: unknown, ctx: GremlinContext) =>
  resolveFiles(extractFilePaths(parent.attachments), ctx.serverBaseUrl);

const node: AgentLogEdgeResolvers["node"] = (parent) => parent.node;

const pendingInboxMessages = async (
  _parent: unknown,
  { agentId, taskId }: { agentId: string; taskId?: string | null },
  ctx: GremlinContext,
) => {
  const lane = taskId ? `task:${taskId}` : "main";
  const items = await ctx.services.inbox.getUnreadItems(ctx, agentId, lane);

  const userTypes = new Set(["user_message", "user_task_message"]);
  return items
    .filter((item) => userTypes.has(item.type))
    .map((item) => {
      const payload = JSON.parse(item.payload);
      return {
        id: item.id,
        content: payload.content as string,
        createdAt: item.createdAt,
      };
    });
};

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
  Query: { agentLogs, taskLogs, pendingInboxMessages },
  Mutation: { sendMessage },
  Subscription: { agentLogCreated },
  AgentLog: { agent, attachments, documents, files },
  AgentLogEdge: { node },
};
