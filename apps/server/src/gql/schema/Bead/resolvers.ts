import type { BeadIssueEvent } from "@opengremlin/lib/resources/pubsub.js";
import type { GremlinContext } from "../../context.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map the raw beads status string to the GraphQL enum value. */
const toBeadStatus = (
  raw: string,
): "OPEN" | "IN_PROGRESS" | "BLOCKED" | "CLOSED" => {
  switch (raw) {
    case "in_progress":
      return "IN_PROGRESS";
    case "blocked":
      return "BLOCKED";
    case "closed":
      return "CLOSED";
    default:
      return "OPEN";
  }
};

const mapIssue = (issue: BeadIssueEvent) => ({
  id: issue.id,
  title: issue.title,
  status: toBeadStatus(issue.status),
  assignee: issue.assignee ?? null,
  parentId: issue.parent_id ?? null,
  latestComment: issue.latest_comment ?? null,
  // Keep the raw children for the field-level resolver
  _children: issue.children,
});

type MappedBead = ReturnType<typeof mapIssue>;

// ---------------------------------------------------------------------------
// Query resolvers
// ---------------------------------------------------------------------------

const bead = async (
  _parent: unknown,
  { id }: { id: string },
  ctx: GremlinContext,
) => {
  const summary = await ctx.services.beads.showIssue({ issue_id: id });
  return {
    id: summary.id,
    title: summary.title,
    status: toBeadStatus(summary.status),
    assignee: summary.assignee ?? null,
    parentId: summary.parentId ?? null,
    latestComment: null,
    _children: null,
  };
};

// ---------------------------------------------------------------------------
// Bead field resolvers
// ---------------------------------------------------------------------------

/** Resolve agent ID → display name via the existing agent loader. */
const assigneeName = async (
  parent: MappedBead,
  _args: unknown,
  ctx: GremlinContext,
) => {
  if (!parent.assignee) return null;
  const agent = await ctx.loaders.agentLoader.load(parent.assignee);
  return agent?.name ?? null;
};

/** Return child beads one level deep, mapped to the GraphQL shape. */
const children = (parent: MappedBead) => {
  if (!parent._children || parent._children.length === 0) return null;
  return parent._children.map(mapIssue);
};

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

const beadUpdated = {
  subscribe: (_parent: unknown, { id }: { id: string }, ctx: GremlinContext) =>
    // TODO: Publish beadUpdated events from the reconciler / beads MCP layer
    // using ctx.resources.pubsub.publish(`beadUpdated:${id}`, payload).
    ctx.resources.pubsub.subscribe(`beadUpdated:${id}`),
  resolve: (payload: BeadIssueEvent) => mapIssue(payload),
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const beadResolvers = {
  Query: { bead },
  Bead: { assigneeName, children },
  Subscription: { beadUpdated },
};
