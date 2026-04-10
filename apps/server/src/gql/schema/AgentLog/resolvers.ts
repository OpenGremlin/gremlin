import { filter, pipe } from "@graphql-yoga/subscription";
import type { AgentLogItem } from "@opengremlin/lib/resources/ddb/schema/agentLog.js";
import type {
  AgentStreamEvent,
  SpeechAudioEvent,
} from "@opengremlin/lib/resources/pubsub.js";
import { computeDisplayHint } from "@opengremlin/lib/services/orchestrator/displayHint.js";
import { getSpeechConnectionId } from "@opengremlin/lib/services/orchestrator/model.js";
import { SentenceAccumulator } from "@opengremlin/lib/services/speech/SentenceAccumulator.js";
import { buildSpeechUrl } from "@opengremlin/lib/services/speech/signedSpeechUrl.js";
import { stripMarkdownForSpeech } from "@opengremlin/lib/services/speech/stripMarkdownForSpeech.js";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import type { GremlinContext } from "../../context.js";
import type {
  AgentLogEdgeResolvers,
  AgentLogResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";
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

// biome-ignore lint/suspicious/noExplicitAny: files field not in generated types yet
const files = async (parent: any, _args: unknown, ctx: GremlinContext) =>
  resolveFiles(extractFilePaths(parent.attachments), ctx.serverBaseUrl);

const node: AgentLogEdgeResolvers["node"] = (parent) => parent.node;

/** Split text into sentences and build a TTS URL for each. */
function textToSpeechUrls(
  text: string,
  voice: string | undefined,
  connectionId: string,
  baseUrl: string,
): string[] {
  const acc = new SentenceAccumulator();
  const sentences = acc.push(text);
  const last = acc.flush();
  if (last) sentences.push(last);

  const urls: string[] = [];
  for (const sentence of sentences) {
    const cleaned = stripMarkdownForSpeech(sentence);
    if (!cleaned) continue;
    urls.push(buildSpeechUrl(baseUrl, { text: cleaned, voice, connectionId }));
  }
  return urls;
}

const speechUrls = async (
  _parent: unknown,
  { logId }: { logId: string },
  ctx: GremlinContext,
): Promise<string[]> => {
  const { Item: log } = await ctx.resources.ddb.entities.AgentLog.build(
    GetItemCommand,
  )
    .key({ id: logId })
    .send();
  if (!log || log.role !== "AGENT") return [];

  const agent = await ctx.loaders.agentLoader.load(log.agentId);
  if (!agent?.config?.speech?.enabled) return [];

  const connectionId = await getSpeechConnectionId(
    ctx,
    agent.config.speechModel,
  );
  if (!connectionId) return [];

  return textToSpeechUrls(
    log.content,
    agent.config.speech.voice,
    connectionId,
    ctx.serverBaseUrl,
  );
};

const documentSpeechUrls = async (
  _parent: unknown,
  { text, agentId }: { text: string; agentId: string },
  ctx: GremlinContext,
): Promise<string[]> => {
  const agent = await ctx.loaders.agentLoader.load(agentId);
  if (!agent?.config?.speech?.enabled) return [];

  const connectionId = await getSpeechConnectionId(
    ctx,
    agent.config.speechModel,
  );
  if (!connectionId) return [];

  return textToSpeechUrls(
    text,
    agent.config.speech.voice,
    connectionId,
    ctx.serverBaseUrl,
  );
};

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

const logCreated = {
  subscribe: (
    _parent: unknown,
    { agentId, taskId }: { agentId?: string; taskId?: string },
    ctx: GremlinContext,
  ) => {
    if (!agentId && !taskId) {
      throw new Error("logCreated requires either agentId or taskId");
    }
    const topic = taskId
      ? (`agentLogCreated:task:${taskId}` as const)
      : (`agentLogCreated:${agentId}` as const);
    return pipe(
      ctx.resources.pubsub.subscribe(topic),
      filter((payload: AgentLogItem) => !payload.internal),
    );
  },
  resolve: (payload: AgentLogItem) => payload,
};

const agentStream = {
  subscribe: (
    _parent: unknown,
    { agentId }: { agentId: string },
    ctx: GremlinContext,
  ) => ctx.resources.pubsub.subscribe(`agentStream:${agentId}`),
  resolve: (payload: AgentStreamEvent) => payload,
};

const speechStream = {
  subscribe: (
    _parent: unknown,
    { agentId, taskId }: { agentId?: string; taskId?: string },
    ctx: GremlinContext,
  ) => {
    if (!agentId && !taskId) {
      throw new Error("speechStream requires either agentId or taskId");
    }
    const topic = taskId
      ? (`speechAudio:task:${taskId}` as const)
      : (`speechAudio:${agentId}` as const);
    return ctx.resources.pubsub.subscribe(topic);
  },
  resolve: (payload: SpeechAudioEvent) => payload,
};

export const agentLogResolvers = {
  Query: {
    agentLogs,
    taskLogs,
    pendingInboxMessages,
    speechUrls,
    documentSpeechUrls,
  },
  Mutation: { sendMessage },
  Subscription: { agentLogCreated, logCreated, agentStream, speechStream },
  AgentLog: {
    agent,
    displayHint: (parent: AgentLogItem) => {
      if (parent.role !== "TOOL" || !parent.toolName) return null;
      const input = parent.toolInput ? JSON.parse(parent.toolInput) : null;
      const result = parent.toolResult ? JSON.parse(parent.toolResult) : null;
      return computeDisplayHint(parent.toolName, input, result)?.text ?? null;
    },
    displayVariant: (parent: AgentLogItem) => {
      if (parent.role !== "TOOL" || !parent.toolName) return null;
      const input = parent.toolInput ? JSON.parse(parent.toolInput) : null;
      const result = parent.toolResult ? JSON.parse(parent.toolResult) : null;
      return (
        computeDisplayHint(parent.toolName, input, result)?.variant ?? null
      );
    },
    attachments,
    files,
  },
  AgentLogEdge: { node },
};
