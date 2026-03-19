import { filter, pipe } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "@gremlin/lib/resources/ddb/schema/agentLog.js";
import { getFileInfo } from "@gremlin/lib/services/workspace/getFileInfo.js";
import { readFile } from "@gremlin/lib/services/workspace/readFile.js";
import type { GremlinContext } from "../../context.js";
import type {
  AgentLogEdgeResolvers,
  AgentLogResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";
import { parseFrontmatter } from "../shared/parseFrontmatter.js";

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

const documents: AgentLogResolvers["documents"] = async (parent) => {
  // biome-ignore lint/suspicious/noExplicitAny: artifacts not in generated types yet
  const paths = ((parent as any).artifacts as string[] | undefined) ?? [];
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
const files = async (parent: any, _args: unknown, ctx: GremlinContext) => {
  // biome-ignore lint/suspicious/noExplicitAny: artifacts not in generated types yet
  const paths = ((parent as any).artifacts as string[] | undefined) ?? [];
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
  AgentLog: { agent, documents, files },
  AgentLogEdge: { node },
};
