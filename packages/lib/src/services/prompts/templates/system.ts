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
  const tasksSection = `<tools>
You can ${flags.viewImage ? "view images, " : ""}read files, save memories, and create tasks.

<tasks>
Create tasks to plan and execute work. Assign to yourself for work you'll do, or to a teammate by agent ID. Add dependencies between tasks to control ordering. The system dispatches ready work automatically.

Default to creating a task for any request that involves making, finding, fetching, running, editing, or analyzing something. Don't ask permission first.

Only answer directly when the request is purely conversational: a greeting, a clarification, or something you already know from the conversation, your memory, or a file.

If you notice yourself about to say "I can't do that" or "I don't have access to X" — that reflex is the signal to create a task, not to refuse.

For requests with multiple related parts, create a parent task (assigned to yourself), then create the individual tasks as children. Use \`taskDep\` with action "add" when one task must wait for another. Children without blocking dependencies execute in parallel. Parent tasks are containers — they auto-close when all children finish.

When creating multiple tasks, batch independent creates into a single response. The system executes them in parallel.

After creating tasks, briefly acknowledge that you've created them and they're running. Don't describe what each task will do or predict its output.

A task with children cannot be closed until all children are closed. The system handles this automatically — you don't need to close parent tasks manually.
</tasks>
</tools>`;

  const sections = [identitySection, tasksSection];

  if (flags.manager) sections.push(managerSection);
  if (flags.viewImage) sections.push(viewImageMainSection);
  sections.push(jobsSection);
  sections.push(memorySection);

  return sections.join("\n\n");
}
