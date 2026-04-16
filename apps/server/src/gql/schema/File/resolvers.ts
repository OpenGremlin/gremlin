import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { buildWorkspaceFileUrl } from "@opengremlin/lib/services/workspace/buildFileUrl.js";
import {
  detectFileType,
  detectRenderKind,
  effectiveExtension,
  languageByExtension,
} from "@opengremlin/lib/services/workspace/mime.js";
import { readFile } from "@opengremlin/lib/services/workspace/readFile.js";
import imageSize from "image-size";
import { getWorkspacePath } from "../../../shared/workspacePath.js";
import type { GremlinContext } from "../../context.js";
import { parseFrontmatter } from "../shared/parseFrontmatter.js";

interface FileParent {
  path: string;
  name: string;
  sizeBytes: number;
  mimeType: string | null;
  modifiedAt: string;
  _serverBase: string;
}

async function getImageDimensions(
  filePath: string,
): Promise<{ width: number; height: number; aspectRatio: number } | null> {
  try {
    const workspacePath = getWorkspacePath();
    const resolved = nodePath.resolve(workspacePath, filePath);
    // Read only the first 512KB — image-size only needs the header
    const handle = await fs.open(resolved, "r");
    const buf = Buffer.alloc(512 * 1024);
    const { bytesRead } = await handle.read(buf, 0, buf.length, 0);
    await handle.close();
    const result = imageSize(buf.subarray(0, bytesRead));
    if (result.width && result.height) {
      return {
        width: result.width,
        height: result.height,
        aspectRatio: result.width / result.height,
      };
    }
  } catch {
    // Can't read dimensions — not critical
  }
  return null;
}

const file = async (
  _parent: unknown,
  { path: filePath }: { path: string },
  ctx: GremlinContext,
) => {
  const info = await ctx.services.workspace.getFileInfo(filePath);
  if (!info) return null;
  return { ...info, _serverBase: ctx.serverBaseUrl };
};

const render = async (parent: FileParent) => {
  const ext = effectiveExtension(parent.name);
  const kind = detectRenderKind(parent.mimeType, ext);
  const serverBase = parent._serverBase;

  switch (kind) {
    case "document": {
      const content = await readFile(parent.path);
      if (!content) {
        return {
          __typename: "UnknownRender" as const,
          mimeType: parent.mimeType,
          sizeBytes: parent.sizeBytes,
        };
      }
      const { title, body } = parseFrontmatter(content);
      return {
        __typename: "DocumentRender" as const,
        markdown: body,
        title: title || null,
      };
    }
    case "code": {
      const content = await readFile(parent.path);
      if (!content) {
        return {
          __typename: "UnknownRender" as const,
          mimeType: parent.mimeType,
          sizeBytes: parent.sizeBytes,
        };
      }
      return {
        __typename: "CodeRender" as const,
        content,
        language: languageByExtension(ext),
      };
    }
    case "image": {
      const dims = await getImageDimensions(parent.path);
      return {
        __typename: "ImageRender" as const,
        _filePath: parent.path,
        _serverBase: serverBase,
        aspectRatio: dims?.aspectRatio ?? null,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
      };
    }
    case "pdf":
      return {
        __typename: "PdfRender" as const,
        url: buildWorkspaceFileUrl(serverBase, parent.path),
      };
    case "audio":
      return {
        __typename: "AudioRender" as const,
        url: buildWorkspaceFileUrl(serverBase, parent.path),
        durationSeconds: null,
      };
    case "video":
      return {
        __typename: "VideoRender" as const,
        url: buildWorkspaceFileUrl(serverBase, parent.path),
        thumbnailUrl: null,
        durationSeconds: null,
      };
    default:
      return {
        __typename: "UnknownRender" as const,
        mimeType: parent.mimeType,
        sizeBytes: parent.sizeBytes,
      };
  }
};

// ImageRender.url is a field with a width argument, so we resolve it lazily
const imageRenderUrl = (
  parent: { _filePath: string; _serverBase: string },
  args: { width?: number | null },
) => {
  return buildWorkspaceFileUrl(parent._serverBase, parent._filePath, {
    width: args.width,
  });
};

export const fileResolvers = {
  Query: { file },
  File: {
    render,
    fileType: (parent: FileParent) =>
      detectFileType(effectiveExtension(parent.name)),
  },
  FileRender: {
    __resolveType: (obj: { __typename: string }) => obj.__typename,
  },
  ImageRender: {
    url: imageRenderUrl,
  },
};
