import { ToolName } from "../../../../enums.js";
import type { DisplayHint, HintBuilder } from "../types.js";

const ensureSandbox: HintBuilder = (_input, result) => {
  const status = result?.status as string | undefined;
  if (status === "ready") {
    return {
      text: "Preparing sandbox",
      variant: "success",
    } satisfies DisplayHint;
  }
  return { text: "Connecting to sandbox", variant: "warning" };
};

export const sandboxHints: Record<string, HintBuilder> = {
  [ToolName.EnsureSandbox]: ensureSandbox,
};
