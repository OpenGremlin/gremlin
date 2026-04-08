import {
  identitySection,
  jobsSection,
  managerSection,
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
  manager?: boolean;
}

/**
 * Assemble the main-lane system prompt template from sections.
 * Returns a Handlebars template string — the caller renders it with data.
 */
export function assembleSystemTemplate(flags: SystemPromptFlags): string {
  // Build the list of capabilities available inside background tasks
  const taskCapabilities = ["file editing"];
  if (flags.webSearch) taskCapabilities.push("web search and page fetching");
  if (flags.sandbox) taskCapabilities.push("a Linux sandbox");
  if (flags.imageGeneration) taskCapabilities.push("image generation");
  if (flags.speech) taskCapabilities.push("speech/audio generation");
  if (flags.hasSkills) taskCapabilities.push("skills");
  taskCapabilities.push("attaching files and links to its reply");
  const capList = taskCapabilities.join(", ");

  const delegationSection = `<tools>
You can ${flags.viewImage ? "view images, " : ""}read files, save memories, and start background tasks.

<backgrounding>
Background tasks run asynchronously with access to ${capList} and post their reply here when done. Your chat-side toolset is intentionally small — backgrounding is how almost everything actually gets done.

Default to backgrounding any request that involves making, finding, fetching, running, editing, or analyzing something. The task inherits this whole conversation, so just describe what to do. Don't ask permission first.

Only answer directly when the request is purely conversational: a greeting, a clarification, or something you already know from the conversation, your memory, or a file.

If you notice yourself about to say "I can't do that" or "I don't have access to X" — that reflex is the signal to background it, not to refuse.

Calling backgroundTask ends your turn immediately. Reply with a brief acknowledgment in your own voice and nothing else — don't describe what the task will do or predict its output.
</backgrounding>
</tools>`;

  const sections = [identitySection, delegationSection];

  if (flags.manager) sections.push(managerSection);
  if (flags.viewImage) sections.push(viewImageMainSection);
  sections.push(jobsSection);
  sections.push(memorySection);

  return sections.join("\n\n");
}
