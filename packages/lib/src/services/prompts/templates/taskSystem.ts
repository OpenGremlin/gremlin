import {
  identitySection,
  jobsSection,
  memorySection,
  taskChatSection,
  taskFileEditorSection,
  taskPlanSection,
  taskPreambleSection,
  taskProgramsSection,
  taskSandboxSection,
  taskToolGuidanceSection,
  taskWorkflowSection,
} from "./sections/index.js";

export interface TaskSystemPromptFlags {
  viewImage: boolean;
  sandbox: boolean;
  programs: boolean;
  hasPlan: boolean;
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

  if (flags.sandbox) sections.push(taskSandboxSection);
  if (flags.programs) sections.push(taskProgramsSection);
  if (flags.hasPlan) sections.push(taskPlanSection);
  sections.push(taskWorkflowSection);
  sections.push(jobsSection);
  sections.push(memorySection);
  sections.push(taskChatSection);

  return sections.join("\n\n");
}
