import type { GremlinContext } from "../../context.js";

const workspaceEntries = (
  _parent: unknown,
  { path }: { path: string },
  ctx: GremlinContext,
) => ctx.services.workspace.listEntries(path);

const workspaceFile = (
  _parent: unknown,
  { path }: { path: string },
  ctx: GremlinContext,
) => ctx.services.workspace.readFile(path);

export const workspaceResolvers = {
  Query: { workspaceEntries, workspaceFile },
};
