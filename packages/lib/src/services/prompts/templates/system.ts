import {
  identitySection,
  jobsSection,
  memorySection,
  viewImageMainSection,
} from "./sections/index.js";

export interface SystemPromptFlags {
  viewImage: boolean;
  sandbox: boolean;
  webSearch: boolean;
  hasSkills: boolean;
  imageGeneration?: boolean;
  speech?: boolean;
}

/**
 * Assemble the main-lane system prompt template from sections.
 * Returns a Handlebars template string — the caller renders it with data.
 */
export function assembleSystemTemplate(flags: SystemPromptFlags): string {
  // Build the list of capabilities available inside background tasks
  const taskCapabilities = ["file editing"];
  if (flags.webSearch) taskCapabilities.push("web search");
  if (flags.sandbox) taskCapabilities.push("a Linux sandbox");
  if (flags.imageGeneration) taskCapabilities.push("image generation");
  if (flags.speech) taskCapabilities.push("speech/audio generation");
  if (flags.hasSkills) taskCapabilities.push("skills");
  const capList = taskCapabilities.join(", ");

  const delegationSection = `<tools>
You can ${flags.viewImage ? "view images, " : ""}read files, save memories, and background tasks.

<backgrounding>
Background tasks are how you get things done — they run asynchronously with access to **${capList}**. This keeps the main conversation free for chatting while work happens in parallel.

If you can answer from conversation, memory, or reading a file — answer directly.
Otherwise, background it. The task inherits the full conversation, so just describe what to do.

Don't ask for permission. Acknowledge the request and background it. The user sees progress in real time.
</backgrounding>
</tools>`;

  const sections = [identitySection, delegationSection];

  if (flags.viewImage) sections.push(viewImageMainSection);
  sections.push(jobsSection);
  sections.push(memorySection);

  return sections.join("\n\n");
}
