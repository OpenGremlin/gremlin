import { ToolName } from "../../../../enums.js";
import type { HintBuilder } from "../types.js";

const readFile: HintBuilder = (input) => ({
  text: `Reading file: ${(input?.file_path as string) ?? "unknown"}`,
});

const writeFile: HintBuilder = (input, result) => ({
  text: `Writing file: ${(result?.path as string) ?? (input?.file_path as string) ?? "unknown"}`,
});

const editFile: HintBuilder = (input, result) => ({
  text: `Editing file: ${(result?.path as string) ?? (input?.file_path as string) ?? "unknown"}`,
});

const listFiles: HintBuilder = (input) => ({
  text: `Listing files: ${(input?.path as string) ?? "."}`,
});

const glob: HintBuilder = (input) => ({
  text: `Searching files: ${(input?.pattern as string) ?? "unknown"}`,
});

const grep: HintBuilder = (input) => ({
  text: `Searching for: ${(input?.pattern as string) ?? "unknown"}`,
});

export const fileEditorHints: Record<string, HintBuilder> = {
  [ToolName.ReadFile]: readFile,
  [ToolName.WriteFile]: writeFile,
  [ToolName.EditFile]: editFile,
  [ToolName.ListFiles]: listFiles,
  [ToolName.Glob]: glob,
  [ToolName.Grep]: grep,
};
