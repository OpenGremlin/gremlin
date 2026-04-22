// AWS Bedrock's Converse API validates tool names against
// `[a-zA-Z0-9_-]+`. A violation returns HTTP 400 that the AI SDK
// re-raises only as `AI_NoOutputGeneratedError`, which hides the real
// cause. Fail fast with a clear message instead.
const BEDROCK_TOOL_NAME_RE = /^[a-zA-Z0-9_-]+$/;

export function validateToolNames(tools: Record<string, unknown>): void {
  for (const name of Object.keys(tools)) {
    if (!BEDROCK_TOOL_NAME_RE.test(name)) {
      throw new Error(
        `Invalid tool name ${JSON.stringify(name)}: must match ${BEDROCK_TOOL_NAME_RE} (Bedrock constraint). Rename the tool map key.`,
      );
    }
  }
}
