import { getFileInfo } from "./getFileInfo.js";
import { listEntries } from "./listEntries.js";
import { readFile } from "./readFile.js";
import { searchFiles } from "./searchFiles.js";

export { buildWorkspaceFileUrl } from "./buildFileUrl.js";
export type { FileInfo } from "./getFileInfo.js";
export type { WorkspaceEntry } from "./listEntries.js";
export type { RenderKind } from "./mime.js";
export {
  detectRenderKind,
  languageByExtension,
  mimeByExtension,
} from "./mime.js";
export type { SearchMode, SearchResult } from "./searchFiles.js";

export interface WorkspaceService {
  listEntries: typeof listEntries;
  readFile: typeof readFile;
  getFileInfo: typeof getFileInfo;
  searchFiles: typeof searchFiles;
}

export const workspaceService: WorkspaceService = {
  listEntries,
  readFile,
  getFileInfo,
  searchFiles,
};
