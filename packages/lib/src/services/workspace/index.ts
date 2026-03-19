import { getFileInfo } from "./getFileInfo.js";
import { listEntries } from "./listEntries.js";
import { readFile } from "./readFile.js";

export {
  buildWorkspaceFileUrl,
  verifyFileSignature,
} from "./buildFileUrl.js";
export type { FileInfo } from "./getFileInfo.js";
export type { WorkspaceEntry } from "./listEntries.js";
export type { RenderKind } from "./mime.js";
export {
  detectRenderKind,
  languageByExtension,
  mimeByExtension,
} from "./mime.js";

export interface WorkspaceService {
  listEntries: typeof listEntries;
  readFile: typeof readFile;
  getFileInfo: typeof getFileInfo;
}

export const workspaceService: WorkspaceService = {
  listEntries,
  readFile,
  getFileInfo,
};
