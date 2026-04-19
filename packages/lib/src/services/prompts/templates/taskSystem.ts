import {
  identitySection,
  jobsSection,
  memorySection,
  taskFileEditorSection,
  taskPlanSection,
  taskPreambleSection,
  taskSandboxSection,
  taskWorkflowSection,
} from "./sections/index.js";

export interface TaskSystemPromptFlags {
  viewImage: boolean;
  sandbox: boolean;
  hasPlan: boolean;
}

/**
 * Assemble the task-lane system prompt template from sections.
 * Returns a Handlebars template string — the caller renders it with data.
 *
 * Order: who (identity) → what (task context) → how (workflow) →
 * with-what-tools (file editor, sandbox, plan) → auxiliary (jobs, memory).
 */
export function assembleTaskSystemTemplate(
  flags: TaskSystemPromptFlags,
): string {
  const sections = [
    identitySection,
    taskPreambleSection,
    taskWorkflowSection,
    taskFileEditorSection,
  ];

  if (flags.sandbox) sections.push(taskSandboxSection);
  if (flags.hasPlan) sections.push(taskPlanSection);
  sections.push(jobsSection);
  sections.push(memorySection);

  return sections.join("\n\n");
}
