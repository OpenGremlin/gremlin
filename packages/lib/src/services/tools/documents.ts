import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context.js";
import { applyPatches } from "../orchestrator/applyPatches.js";

export function getWorkspacePath() {
  return path.resolve(process.env.WORKSPACE_PATH ?? "/workspace");
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function uniqueFilePath(
  dir: string,
  slug: string,
): Promise<string> {
  let candidate = path.join(dir, `${slug}.md`);
  let i = 1;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${slug}-${i}.md`);
      i++;
    } catch {
      return candidate;
    }
  }
}

export function parseFrontmatter(content: string): {
  title: string;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { title: "", body: content };
  const frontmatter = match[1];
  const body = match[2];
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
  return { title: titleMatch?.[1]?.trim() ?? "", body };
}

export function formatWithFrontmatter(title: string, body: string): string {
  return `---\ntitle: ${title}\n---\n${body}`;
}

export function createDocumentTool(
  ctx: ServiceContext,
  taskId: string | null,
) {
  return tool({
    description:
      "Create a new document. Use this for any substantial written output (stories, reports, plans, etc.).",
    inputSchema: z.object({
      title: z.string().describe("Document title"),
      body: z.string().describe("Document body in markdown"),
    }),
    execute: async ({ title, body }) => {
      const workspace = getWorkspacePath();
      const docsDir = path.join(workspace, "documents");
      await fs.mkdir(docsDir, { recursive: true });

      const slug = slugify(title);
      const filePath = await uniqueFilePath(docsDir, slug);
      const relativePath = path.relative(workspace, filePath);

      await fs.writeFile(filePath, formatWithFrontmatter(title, body), "utf-8");
      if (taskId) {
        await ctx.services.tasks.addTaskArtifact(ctx, taskId, relativePath);
      }
      return { path: relativePath, title };
    },
  });
}

export function updateDocumentTool(_ctx: ServiceContext) {
  return tool({
    description:
      "Update an existing document by applying patches. Send old_text/new_text pairs instead of the full body. To replace text, set old_text to the existing text and new_text to the replacement. To delete text, set new_text to an empty string. To insert text, include surrounding text in old_text and add the new content in new_text.",
    inputSchema: z.object({
      path: z.string().describe("The document file path to update"),
      title: z.string().optional().describe("New title (optional)"),
      patches: z
        .array(
          z.object({
            old_text: z
              .string()
              .describe("The existing text to find in the document"),
            new_text: z
              .string()
              .describe("The replacement text (empty string to delete)"),
          }),
        )
        .min(1)
        .describe("Array of patches to apply sequentially"),
    }),
    execute: async ({ path: filePath, title, patches }) => {
      const workspace = getWorkspacePath();
      const resolved = path.resolve(workspace, filePath);
      if (!resolved.startsWith(workspace)) {
        throw new Error("Path traversal not allowed");
      }

      const content = await fs.readFile(resolved, "utf-8");
      const parsed = parseFrontmatter(content);
      const newBody = applyPatches(parsed.body, patches);
      const newTitle = title ?? parsed.title;

      await fs.writeFile(
        resolved,
        formatWithFrontmatter(newTitle, newBody),
        "utf-8",
      );
      return { path: filePath, title: newTitle };
    },
  });
}
