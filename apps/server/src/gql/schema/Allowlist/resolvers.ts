import type { GremlinContext } from "../../context.js";

const commandAllowlist = async (
  _parent: unknown,
  { agentId }: { agentId: string },
  ctx: GremlinContext,
) => {
  const store = ctx.services.shellGuard.createAllowlistStore(ctx);
  return store.getEntries(agentId);
};

const addCommandAllowlistEntry = async (
  _parent: unknown,
  { agentId, pattern }: { agentId: string; pattern: string },
  ctx: GremlinContext,
) => {
  const trimmed = pattern.trim();
  if (!trimmed) throw new Error("Pattern must not be empty");
  const store = ctx.services.shellGuard.createAllowlistStore(ctx);
  await store.addEntry(agentId, { pattern: trimmed });
  return store.getEntries(agentId);
};

const removeCommandAllowlistEntry = async (
  _parent: unknown,
  { agentId, pattern }: { agentId: string; pattern: string },
  ctx: GremlinContext,
) => {
  const store = ctx.services.shellGuard.createAllowlistStore(ctx);
  await store.removeEntry(agentId, pattern);
  return store.getEntries(agentId);
};

export const allowlistResolvers = {
  Query: { commandAllowlist },
  Mutation: { addCommandAllowlistEntry, removeCommandAllowlistEntry },
};
