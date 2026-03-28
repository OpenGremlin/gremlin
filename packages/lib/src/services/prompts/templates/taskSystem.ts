import {
  identitySection,
  jobsSection,
  memorySection,
  taskChatSection,
  taskPreambleSection,
  taskSandboxSection,
  taskToolGuidanceSection,
  taskWorkflowSection,
} from "./sections.js";

export interface TaskSystemPromptFlags {
  viewImage: boolean;
  sandbox: boolean;
}

/**
 * Assemble the task-lane system prompt template from sections.
 * Returns a Handlebars template string — the caller renders it with data.
 */
export function assembleTaskSystemTemplate(
  flags: TaskSystemPromptFlags,
): string {
  const sections = [
    identitySection,
    taskPreambleSection,
    taskToolGuidanceSection,
  ];

  if (flags.sandbox) sections.push(taskSandboxSection);
  sections.push(taskWorkflowSection);
  sections.push(jobsSection);
  sections.push(memorySection);
  sections.push(taskChatSection);

  return sections.join("\n\n");
}
