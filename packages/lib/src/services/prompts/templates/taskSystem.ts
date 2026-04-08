import {
  delegatedTaskSection,
  identitySection,
  jobsSection,
  memorySection,
  taskChatSection,
  taskFileEditorSection,
  taskPlanSection,
  taskPreambleSection,
  taskSandboxSection,
  taskToolGuidanceSection,
  taskWorkflowSection,
} from "./sections/index.js";

export interface TaskSystemPromptFlags {
  viewImage: boolean;
  sandbox: boolean;
  hasPlan: boolean;
  isDelegated?: boolean;
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
    taskFileEditorSection,
    taskToolGuidanceSection,
  ];

  // For delegated tasks the brief replaces the implicit "you have full
  // conversation context" framing — slot the section in early so the
  // model reads the brief before any other workflow guidance.
  if (flags.isDelegated) sections.push(delegatedTaskSection);
  if (flags.sandbox) sections.push(taskSandboxSection);
  if (flags.hasPlan) sections.push(taskPlanSection);
  sections.push(taskWorkflowSection);
  sections.push(jobsSection);
  sections.push(memorySection);
  sections.push(taskChatSection);

  return sections.join("\n\n");
}
