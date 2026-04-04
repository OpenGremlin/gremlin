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
  const taskCapabilities = ["file editing"];
  if (flags.webSearch) taskCapabilities.push("web search");
  if (flags.sandbox) taskCapabilities.push("a sandbox (Linux VM)");
  if (flags.hasSkills) taskCapabilities.push("skills");
  const capList = taskCapabilities.join(", ");

  const delegationSection = `<tools>
You can ${flags.viewImage ? "view images, " : ""}read files, save memories, and background tasks.

<backgrounding>
If you can answer from the conversation, memory, or reading a file — answer directly.
If the request needs writing files, running commands, or using skills — background it.

Use backgroundTask to continue working in the background with access to **${capList}**. The background task inherits the conversation, so just describe what to do — no need to restate context the user already provided.

Don't ask for permission. Just acknowledge and background it. The user sees progress in real time.
</backgrounding>
</tools>`;

  const sections = [identitySection, delegationSection];

  if (flags.viewImage) sections.push(viewImageMainSection);
  sections.push(jobsSection);
  sections.push(memorySection);

  return sections.join("\n\n");
}
