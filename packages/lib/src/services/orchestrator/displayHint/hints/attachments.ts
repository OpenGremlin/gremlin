import { ToolName } from "../../../../enums.js";
import type { HintBuilder } from "../types.js";

const attachFile: HintBuilder = (input) => ({
  text: `Attaching file: ${(input?.path as string) ?? "unknown"}`,
});

const attachLink: HintBuilder = (input) => ({
  text: `Attaching link: ${(input?.title as string) ?? (input?.url as string) ?? "unknown"}`,
});

export const attachmentHints: Record<string, HintBuilder> = {
  [ToolName.AttachFile]: attachFile,
  [ToolName.AttachLink]: attachLink,
};
