import { ToolName } from "../../../../enums.js";
import type { HintBuilder } from "../types.js";

const webSearch: HintBuilder = (input) => ({
  text: `Searching: ${(input?.query as string) ?? "unknown"}`,
});

const webFetch: HintBuilder = (input) => ({
  text: `Fetching: ${(input?.url as string) ?? "unknown"}`,
});

export const webHints: Record<string, HintBuilder> = {
  [ToolName.WebSearch]: webSearch,
  [ToolName.WebFetch]: webFetch,
};
