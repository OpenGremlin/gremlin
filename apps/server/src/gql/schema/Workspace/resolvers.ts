import * as path from "node:path";
import type { WorkspaceEntry } from "@opengremlin/lib/services/workspace/listEntries.js";
import type { GremlinContext } from "../../context.js";

const MIME_BY_EXT: Record<string, string> = {
  ".md": "text/markdown",
};

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
  WorkspaceEntry: {
    mimeType: (entry: WorkspaceEntry) => {
      if (entry.isDirectory) return null;
      const ext = path.extname(entry.name).toLowerCase();
      return MIME_BY_EXT[ext] ?? null;
    },
  },
};
