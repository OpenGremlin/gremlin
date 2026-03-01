import type {
  ArtifactResolvers,
  StatusResolvers,
  QueryResolvers,
} from "../../resolverTypes.js";

const statuses: QueryResolvers["statuses"] = (_parent, _args, ctx) =>
  ctx.services.statuses.getStatuses(ctx);

const status: QueryResolvers["status"] = (_parent, { id }, ctx) =>
  ctx.services.statuses.getStatus(ctx, id);

const agent: StatusResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.services.agents.getAgent(ctx, parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};

const artifacts: StatusResolvers["artifacts"] = (parent) =>
  parent.artifacts ?? [];

const __resolveType: ArtifactResolvers["__resolveType"] = (obj) => {
  const artifact = obj as unknown as { type: string };
  if (artifact.type === "DOCUMENT") return "Document";
  throw new Error(`Unknown artifact type: ${artifact.type}`);
};

export const feedResolvers = {
  Query: { statuses, status },
  Status: { agent, artifacts },
  Artifact: { __resolveType },
};
