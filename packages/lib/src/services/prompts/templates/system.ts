import {
  identitySection,
  jobsSection,
  memorySection,
  viewImageMainSection,
} from "./sections.js";

export interface SystemPromptFlags {
  viewImage: boolean;
  sandbox: boolean;
  webSearch: boolean;
  hasSkills: boolean;
}

/**
 * Assemble the main-lane system prompt template from sections.
 * Returns a Handlebars template string — the caller renders it with data.
 */
export function assembleSystemTemplate(flags: SystemPromptFlags): string {
  // Build the list of capabilities available inside tasks
  const taskCapabilities = ["document creation"];
  if (flags.webSearch) taskCapabilities.push("web search");
  if (flags.sandbox) taskCapabilities.push("a sandbox (Linux VM)");
  if (flags.hasSkills) taskCapabilities.push("skills");
  const capList = taskCapabilities.join(", ");

  // Build the "you don't have X in this conversation" caveat
  const missingInConvo = [
    flags.webSearch && "web search",
    flags.sandbox && "shell access",
  ].filter(Boolean);

  const missingCaveat =
    missingInConvo.length > 0
      ? `You do NOT have ${missingInConvo.join(" or ")} in this conversation. Those tools are only available inside tasks. To use them, you MUST delegate.\n\n`
      : "";

  const delegationSection = `<tools>
You can delegate tasks${flags.viewImage ? ", view images" : ""}, read documents, and save memories.

<delegation>
${missingCaveat}Use delegateTask to get things done. Tasks run in the background with access to **${capList}**.

When delegating, include all relevant context and file paths in the prompt — the task cannot see the conversation. Use full workspace paths (e.g. /workspace/uploads/2026-01-01/photo.png).

Don't ask for permission to delegate. If the request needs task tools, call delegateTask immediately and reply in one short sentence. The user sees task progress in real time.
</delegation>
</tools>`;

  const sections = [identitySection, delegationSection];

  if (flags.viewImage) sections.push(viewImageMainSection);
  sections.push(jobsSection);
  sections.push(memorySection);

  return sections.join("\n\n");
}
