import * as path from "node:path";
import type { WorkspaceEntry } from "@opengremlin/lib/services/workspace/listEntries.js";
import { detectFileType } from "@opengremlin/lib/services/workspace/mime.js";
import type { SearchMode } from "@opengremlin/lib/services/workspace/searchFiles.js";
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

const workspaceSearch = (
  _parent: unknown,
  { query, mode }: { query: string; mode?: SearchMode },
  ctx: GremlinContext,
) => ctx.services.workspace.searchFiles(query, mode ?? "ALL");

const deleteWorkspaceEntries = async (
  _parent: unknown,
  { paths }: { paths: string[] },
  ctx: GremlinContext,
) => {
  const { deleted, failed } = await ctx.services.workspace.deleteEntries(paths);
  return { succeeded: deleted, failed };
};

const moveWorkspaceEntries = async (
  _parent: unknown,
  { paths, destination }: { paths: string[]; destination: string },
  ctx: GremlinContext,
) => {
  const { moved, failed } = await ctx.services.workspace.moveEntries(
    paths,
    destination,
  );

  // Fire-and-forget: update attachment paths for moved files/directories
  if (moved.length > 0) {
    const destDir =
      destination === "" ? "" : `${destination.replace(/\/$/, "")}/`;
    Promise.all(
      moved.map((sourcePath) => {
        const name = sourcePath.split("/").pop() ?? sourcePath;
        const newPath = destDir + name;
        return ctx.services.tasks.updateAttachmentPaths(
          ctx,
          sourcePath,
          newPath,
        );
      }),
    ).catch((err) => {
      ctx.log.error("Failed to update attachment paths after move", err);
    });
  }

  return { succeeded: moved, failed };
};

const createWorkspaceFolder = (
  _parent: unknown,
  { path }: { path: string },
  ctx: GremlinContext,
) => ctx.services.workspace.createFolder(path);

export const workspaceResolvers = {
  Query: { workspaceEntries, workspaceFile, workspaceSearch },
  Mutation: {
    deleteWorkspaceEntries,
    moveWorkspaceEntries,
    createWorkspaceFolder,
  },
  WorkspaceEntry: {
    mimeType: (entry: WorkspaceEntry) => {
      if (entry.isDirectory) return null;
      const ext = path.extname(entry.name).toLowerCase();
      return MIME_BY_EXT[ext] ?? null;
    },
    fileType: (entry: WorkspaceEntry) => {
      if (entry.isDirectory) return null;
      return detectFileType(path.extname(entry.name));
    },
  },
  WorkspaceSearchResult: {
    fileType: (result: { name: string }) => {
      return detectFileType(path.extname(result.name));
    },
  },
};
