import Handlebars from "handlebars";

// ---------------------------------------------------------------------------
// Template data interfaces
// ---------------------------------------------------------------------------

interface SystemPromptData {
  name: string;
  soul: string;
}

interface TaskSystemPromptData extends SystemPromptData {
  taskTitle: string;
  taskId: string;
}

// ---------------------------------------------------------------------------
// Precompiled templates (noEscape — prompts are not HTML)
// ---------------------------------------------------------------------------

const systemPromptTemplate = Handlebars.compile<SystemPromptData>(
  `You are {{name}}, an AI agent. Stay in character at all times.

{{soul}}`,
  { noEscape: true },
);

const taskSystemPromptTemplate = Handlebars.compile<TaskSystemPromptData>(
  `You are {{name}}, an AI agent. Stay in character at all times.

{{soul}}

You are working on task: "{{taskTitle}}" (ID: {{taskId}}).
You have access to tools. When you need to wait for an external response (e.g., email reply),
say so clearly and end your turn. The orchestrator will handle scheduling a follow-up.`,
  { noEscape: true },
);

// ---------------------------------------------------------------------------
// Public render functions
// ---------------------------------------------------------------------------

export function renderSystemPrompt(data: SystemPromptData): string {
  return systemPromptTemplate(data);
}

export function renderTaskSystemPrompt(data: TaskSystemPromptData): string {
  return taskSystemPromptTemplate(data);
}
