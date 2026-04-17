import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestContext } from "../../../__testing__/buildTestContext.js";
import { invokeResolver } from "../../../__testing__/invokeResolver.js";
import { workspaceResolvers } from "./resolvers.js";

describe("Workspace resolvers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("workspaceEntries delegates to workspace.listEntries", async () => {
    const entries = [{ name: "file.txt", isDirectory: false }];
    const ctx = buildTestContext();
    ctx.services.workspace.listEntries = vi.fn().mockResolvedValue(entries);

    const result = await invokeResolver(
      workspaceResolvers.Query.workspaceEntries,
      { args: { path: "/docs" }, ctx },
    );

    expect(result).toBe(entries);
    expect(ctx.services.workspace.listEntries).toHaveBeenCalledWith("/docs");
  });

  it("workspaceFile delegates to workspace.readFile", async () => {
    const file = { content: "hello", mimeType: "text/plain" };
    const ctx = buildTestContext();
    ctx.services.workspace.readFile = vi.fn().mockResolvedValue(file);

    const result = await invokeResolver(
      workspaceResolvers.Query.workspaceFile,
      { args: { path: "/docs/readme.md" }, ctx },
    );

    expect(result).toBe(file);
    expect(ctx.services.workspace.readFile).toHaveBeenCalledWith(
      "/docs/readme.md",
    );
  });

  it("workspaceSearch defaults mode to ALL", async () => {
    const results = [{ name: "match.ts", path: "src/match.ts" }];
    const ctx = buildTestContext();
    ctx.services.workspace.searchFiles = vi.fn().mockResolvedValue(results);

    const result = await invokeResolver(
      workspaceResolvers.Query.workspaceSearch,
      { args: { query: "match" }, ctx },
    );

    expect(result).toBe(results);
    expect(ctx.services.workspace.searchFiles).toHaveBeenCalledWith(
      "match",
      "ALL",
    );
  });

  it("deleteWorkspaceEntries maps deleted→succeeded", async () => {
    const ctx = buildTestContext();
    ctx.services.workspace.deleteEntries = vi
      .fn()
      .mockResolvedValue({ deleted: ["a.txt"], failed: [] });

    const result = await invokeResolver(
      workspaceResolvers.Mutation.deleteWorkspaceEntries,
      { args: { paths: ["a.txt"] }, ctx },
    );

    expect(result).toEqual({ succeeded: ["a.txt"], failed: [] });
  });

  it("moveWorkspaceEntries maps moved→succeeded and fires attachment path update", async () => {
    const ctx = buildTestContext();
    ctx.services.workspace.moveEntries = vi
      .fn()
      .mockResolvedValue({ moved: ["old/a.txt"], failed: [] });
    ctx.services.tasks.updateAttachmentPaths = vi
      .fn()
      .mockResolvedValue(undefined);

    const result = await invokeResolver(
      workspaceResolvers.Mutation.moveWorkspaceEntries,
      { args: { paths: ["old/a.txt"], destination: "new" }, ctx },
    );

    expect(result).toEqual({ succeeded: ["old/a.txt"], failed: [] });

    // Fire-and-forget attachment path update for the moved file
    await vi.waitFor(() =>
      expect(ctx.services.tasks.updateAttachmentPaths).toHaveBeenCalledWith(
        ctx,
        "old/a.txt",
        "new/a.txt",
      ),
    );
  });

  it("createWorkspaceFolder delegates to workspace.createFolder", async () => {
    const ctx = buildTestContext();
    ctx.services.workspace.createFolder = vi.fn().mockResolvedValue(true);

    const result = await invokeResolver(
      workspaceResolvers.Mutation.createWorkspaceFolder,
      { args: { path: "new-folder" }, ctx },
    );

    expect(result).toBe(true);
    expect(ctx.services.workspace.createFolder).toHaveBeenCalledWith(
      "new-folder",
    );
  });

  it("WorkspaceEntry.mimeType returns text/markdown for .md files", () => {
    const entry = {
      name: "readme.md",
      isDirectory: false,
      path: "",
      size: 0,
      modifiedAt: "",
    };
    expect(workspaceResolvers.WorkspaceEntry.mimeType(entry)).toBe(
      "text/markdown",
    );
  });

  it("WorkspaceEntry.mimeType returns null for directories", () => {
    const entry = {
      name: "docs",
      isDirectory: true,
      path: "",
      size: 0,
      modifiedAt: "",
    };
    expect(workspaceResolvers.WorkspaceEntry.mimeType(entry)).toBeNull();
  });
});
