import type {
  MutationResolvers,
  QueryResolvers,
  WebhookResolvers,
} from "../../resolverTypes.js";

// --- Queries ---

const webhooks: QueryResolvers["webhooks"] = (_parent, _args, ctx) =>
  ctx.services.webhooks.listWebhooks(ctx);

const webhook: QueryResolvers["webhook"] = (_parent, { id }, ctx) =>
  ctx.services.webhooks.getWebhook(ctx, id);

// --- Mutations ---

const createWebhook: MutationResolvers["createWebhook"] = async (
  _parent,
  { name, scopes },
  ctx,
) => {
  const result = await ctx.services.webhooks.createWebhook(ctx, {
    name,
    scopes,
  });
  return {
    webhook: result.webhook,
    key: result.keyPlaintext,
    keyId: result.keyId,
  };
};

const updateWebhookScopes: MutationResolvers["updateWebhookScopes"] = async (
  _parent,
  { id, scopes },
  ctx,
) => {
  await ctx.services.webhooks.updateScopes(ctx, id, scopes);
  const updated = await ctx.services.webhooks.getWebhook(ctx, id);
  if (!updated) throw new Error(`Webhook ${id} not found`);
  return updated;
};

const revokeWebhook: MutationResolvers["revokeWebhook"] = async (
  _parent,
  { id },
  ctx,
) => {
  await ctx.services.webhooks.revokeWebhook(ctx, id);
  const updated = await ctx.services.webhooks.getWebhook(ctx, id);
  if (!updated) throw new Error(`Webhook ${id} not found`);
  return updated;
};

const addWebhookKey: MutationResolvers["addWebhookKey"] = async (
  _parent,
  { webhookId },
  ctx,
) => {
  const webhook = await ctx.services.webhooks.getWebhook(ctx, webhookId);
  if (!webhook) throw new Error(`Webhook ${webhookId} not found`);
  const key = await ctx.services.webhooks.addKey(ctx, webhookId);
  return {
    webhook,
    key: key.plaintext,
    keyId: key.id,
  };
};

const revokeWebhookKey: MutationResolvers["revokeWebhookKey"] = async (
  _parent,
  { webhookId, keyId },
  ctx,
) => {
  await ctx.services.webhooks.revokeKey(ctx, keyId);
  const updated = await ctx.services.webhooks.getWebhook(ctx, webhookId);
  if (!updated) throw new Error(`Webhook ${webhookId} not found`);
  return updated;
};

// --- Type resolvers ---

// Use the request-scoped loader so Webhook.keys and Webhook.lastEventAt share
// a single Query per webhook (instead of N+1 across the list).
const Webhook: WebhookResolvers = {
  keys: (parent, _args, ctx) =>
    ctx.loaders.webhookKeysByWebhookIdLoader.load(parent.id),
  lastEventAt: async (parent, _args, ctx) => {
    const keys = await ctx.loaders.webhookKeysByWebhookIdLoader.load(parent.id);
    let max: string | null = null;
    for (const k of keys) {
      if (k.lastUsedAt && (!max || k.lastUsedAt > max)) max = k.lastUsedAt;
    }
    return max;
  },
};

export const webhookResolvers = {
  Query: { webhooks, webhook },
  Mutation: {
    createWebhook,
    updateWebhookScopes,
    revokeWebhook,
    addWebhookKey,
    revokeWebhookKey,
  },
  Webhook,
};
