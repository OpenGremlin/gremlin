import Handlebars from "handlebars";
import { compactionTemplate } from "./templates/compaction.js";
import { cronTemplate } from "./templates/cron.js";
import { systemTemplate } from "./templates/system.js";
import { taskSystemTemplate } from "./templates/taskSystem.js";

interface PromptRegistry {
  system: {
    name: string;
    soul: string;
    userDisplayName: string;
    userAbout?: string;
  };
  taskSystem: {
    name: string;
    soul: string;
    userDisplayName: string;
    userAbout?: string;
    taskTitle: string;
    taskId: string;
  };
  compaction: Record<string, never>;
  cron: {
    timezone: string;
  };
}

const templates: Record<keyof PromptRegistry, string> = {
  system: systemTemplate,
  taskSystem: taskSystemTemplate,
  compaction: compactionTemplate,
  cron: cronTemplate,
};

const compiled = new Map<string, Handlebars.TemplateDelegate>();

function getCompiled(key: string): Handlebars.TemplateDelegate {
  let fn = compiled.get(key);
  if (!fn) {
    fn = Handlebars.compile(templates[key], { noEscape: true });
    compiled.set(key, fn);
  }
  return fn;
}

export function renderPrompt<K extends keyof PromptRegistry>(
  key: K,
  ...args: PromptRegistry[K] extends Record<string, never>
    ? []
    : [data: PromptRegistry[K]]
): string {
  return getCompiled(key)(args[0] ?? {});
}
