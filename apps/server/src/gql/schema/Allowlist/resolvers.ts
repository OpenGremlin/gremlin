import { createAllowlistStore } from "@opengremlin/lib/services/shellGuard/allowlistStore.js";
import type { GremlinContext } from "../../context.js";

// biome-ignore lint/suspicious/noExplicitAny: allowlist types not in generated resolvers yet
type Ctx = any;

const commandAllowlist = async (
  _parent: unknown,
  { agentId }: { agentId: string },
  ctx: GremlinContext,
) => {
  const store = createAllowlistStore(ctx as Ctx);
  return store.getEntries(agentId);
};

const addCommandAllowlistEntry = async (
  _parent: unknown,
  { agentId, pattern }: { agentId: string; pattern: string },
  ctx: GremlinContext,
) => {
  const trimmed = pattern.trim();
  if (!trimmed) throw new Error("Pattern must not be empty");
  const store = createAllowlistStore(ctx as Ctx);
  await store.addEntry(agentId, { pattern: trimmed });
  return store.getEntries(agentId);
};

const removeCommandAllowlistEntry = async (
  _parent: unknown,
  { agentId, pattern }: { agentId: string; pattern: string },
  ctx: GremlinContext,
) => {
  const store = createAllowlistStore(ctx as Ctx);
  await store.removeEntry(agentId, pattern);
  return store.getEntries(agentId);
};

export const allowlistResolvers = {
  Query: { commandAllowlist },
  Mutation: { addCommandAllowlistEntry, removeCommandAllowlistEntry },
};
