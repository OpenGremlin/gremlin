import { ToolName } from "../../../../enums.js";
import type { ServiceContext } from "../../../context.js";
import {
  editFileTool,
  FileStateTracker,
  globTool,
  grepTool,
  listFilesTool,
  readFileTool,
  writeFileTool,
} from "../../../tools/index.js";

/**
 * Build the file editor tool set (read, write, edit, list, glob, grep) with a
 * shared FileStateTracker so that staleness detection works across tools.
 */
export function buildFileEditorTools(ctx: ServiceContext, taskId: string) {
  const tracker = new FileStateTracker();
  return {
    [ToolName.ReadFile]: readFileTool(tracker),
    [ToolName.WriteFile]: writeFileTool(ctx, tracker, taskId),
    [ToolName.EditFile]: editFileTool(ctx, tracker, taskId),
    [ToolName.ListFiles]: listFilesTool(),
    [ToolName.Glob]: globTool(),
    [ToolName.Grep]: grepTool(),
  };
}
