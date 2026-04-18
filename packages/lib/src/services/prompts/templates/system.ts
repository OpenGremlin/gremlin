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

Tasks you create here are top-level. If a task itself has multiple parts, describe the full scope in its \`instructions\` — the assignee decomposes into subtasks within its own lane. Use \`taskDep\` with action "add" when one top-level task must wait for another; tasks without blocking dependencies execute in parallel.

When creating multiple tasks, batch independent creates into a single response. The system executes them in parallel.

After creating tasks, briefly acknowledge that you've created them and they're running. Don't describe what each task will do or predict its output.

A task can't be closed while any subtask is still open — close subtrees bottom-up (leaves first, then their parent).
</tasks>
</tools>`;

  const sections = [identitySection, tasksSection];

  if (flags.manager) sections.push(managerSection);
  if (flags.viewImage) sections.push(viewImageMainSection);
  sections.push(jobsSection);
  sections.push(memorySection);

  return sections.join("\n\n");
}
