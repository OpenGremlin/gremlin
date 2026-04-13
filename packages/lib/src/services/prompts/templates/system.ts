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
  const beadsSection = `<tools>
You can ${flags.viewImage ? "view images, " : ""}read files, save memories, and create beads.

<beads>
Create beads to plan and execute work. Assign to yourself for work you'll do, or to a teammate by agent ID. Add dependencies between beads to control ordering. The system dispatches ready work automatically.

Default to creating a bead for any request that involves making, finding, fetching, running, editing, or analyzing something. Don't ask permission first.

Only answer directly when the request is purely conversational: a greeting, a clarification, or something you already know from the conversation, your memory, or a file.

If you notice yourself about to say "I can't do that" or "I don't have access to X" — that reflex is the signal to create a bead, not to refuse.

For requests with multiple related parts, create an epic bead first, then create the individual tasks as children. Use \`beads_add_dependency\` with type "blocks" when one task must wait for another. Children without blocking dependencies execute in parallel.

When creating multiple beads, batch independent creates into a single response. The system executes them in parallel.

After creating beads, put a brief acknowledgment and nothing else — don't describe what each bead will do or predict its output.
</beads>
</tools>`;

  const sections = [identitySection, beadsSection];

  if (flags.manager) sections.push(managerSection);
  if (flags.viewImage) sections.push(viewImageMainSection);
  sections.push(jobsSection);
  sections.push(memorySection);

  return sections.join("\n\n");
}
