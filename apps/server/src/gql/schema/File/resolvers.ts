import * as path from "node:path";
import {
  detectRenderKind,
  languageByExtension,
} from "@gremlin/lib/services/workspace/mime.js";
import { readFile } from "@gremlin/lib/services/workspace/readFile.js";
import type { GremlinContext } from "../../context.js";
import { parseFrontmatter } from "../shared/parseFrontmatter.js";

interface FileParent {
  path: string;
  name: string;
  sizeBytes: number;
  mimeType: string | null;
  modifiedAt: string;
}

const file = async (
  _parent: unknown,
  { path: filePath }: { path: string },
  ctx: GremlinContext,
) => {
  const info = await ctx.services.workspace.getFileInfo(filePath);
  return info ?? null;
};

const render = async (parent: FileParent) => {
  const ext = path.extname(parent.name);
  const kind = detectRenderKind(parent.mimeType, ext);

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
    case "image":
      return {
        __typename: "ImageRender" as const,
        url: null,
        aspectRatio: null,
        width: null,
        height: null,
      };
    case "audio":
      return {
        __typename: "AudioRender" as const,
        url: null,
        durationSeconds: null,
      };
    case "video":
      return {
        __typename: "VideoRender" as const,
        url: null,
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

export const fileResolvers = {
  Query: { file },
  File: { render },
  FileRender: {
    __resolveType: (obj: { __typename: string }) => obj.__typename,
  },
};
