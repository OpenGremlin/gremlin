import type { GremlinContext } from "../../context.js";

const resolveCommandApproval = async (
  _parent: unknown,
  { id, decision }: { id: string; decision: string },
  ctx: GremlinContext,
) => {
  // biome-ignore lint/suspicious/noExplicitAny: resolveCommandApproval not in generated types yet
  return (ctx.services.shellGuard as any).resolveCommandApproval(
    ctx,
    id,
    decision,
  );
};

// biome-ignore lint/suspicious/noExplicitAny: CommandApproval parent type not in generated types yet
const agent = async (parent: any, _args: unknown, ctx: GremlinContext) => {
  const a = await ctx.loaders.agentLoader.load(parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

export const commandApprovalResolvers = {
  Mutation: { resolveCommandApproval },
  CommandApproval: { agent },
};
