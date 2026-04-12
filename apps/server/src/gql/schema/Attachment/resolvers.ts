import type { GremlinContext } from "../../context.js";

interface FileAttachmentParent {
  type: "file";
  path: string;
}

const fileField = async (
  parent: FileAttachmentParent,
  _args: unknown,
  ctx: GremlinContext,
) => {
  const info = await ctx.services.workspace.getFileInfo(parent.path);
  if (!info) return null;
  return { ...info, _serverBase: ctx.serverBaseUrl };
};

export const attachmentResolvers = {
  Attachment: {
    __resolveType: (obj: { type: string }) => {
      switch (obj.type) {
        case "file":
          return "FileAttachment";
        case "link":
          return "LinkAttachment";
        default:
          return null;
      }
    },
  },
  FileAttachment: { file: fileField },
};
