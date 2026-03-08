import { listEntries } from "./listEntries.js";
import { readFile } from "./readFile.js";

export type { WorkspaceEntry } from "./listEntries.js";

export interface WorkspaceService {
  listEntries: typeof listEntries;
  readFile: typeof readFile;
}

export const workspaceService: WorkspaceService = { listEntries, readFile };
