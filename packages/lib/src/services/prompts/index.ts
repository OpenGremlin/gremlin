import Handlebars from "handlebars";
import { compactionTemplate } from "./templates/compaction.js";
import { cronTemplate } from "./templates/cron.js";
import {
  assembleSystemTemplate,
  type SystemPromptFlags,
} from "./templates/system.js";
import { taskEmojiTemplate } from "./templates/taskEmoji.js";
import {
  assembleTaskSystemTemplate,
  type TaskSystemPromptFlags,
} from "./templates/taskSystem.js";

interface PromptRegistry {
  compaction: Record<string, never>;
  cron: {
    timezone: string;
  };
  taskEmoji: Record<string, never>;
}

const templates: Record<keyof PromptRegistry, string> = {
  compaction: compactionTemplate,
  cron: cronTemplate,
  taskEmoji: taskEmojiTemplate,
};

const compiled = new Map<string, Handlebars.TemplateDelegate>();

function getCompiled(key: keyof PromptRegistry): Handlebars.TemplateDelegate {
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

// ── Capability flag resolution ────────────────────────────────────────

interface AgentConfig {
  viewImage?: { enabled: boolean } | null;
  sandbox?: { enabled: boolean } | null;
  webSearch?: { enabled: boolean } | null;
  imageGeneration?: { enabled: boolean } | null;
  speech?: { enabled: boolean } | null;
  manager?: { enabled: boolean; team?: string[] } | null;
}

/**
 * Derive prompt capability flags from agent config + runtime checks.
 * Used by both prompt renderers and tool assembly — keeps them in sync.
 */
export function resolvePromptFlags(
  config: AgentConfig | undefined | null,
  opts: {
    modelSupportsImages: boolean;
    hasSkills: boolean;
    hasPlan?: boolean;
  },
) {
  return {
    viewImage: !!(config?.viewImage?.enabled && opts.modelSupportsImages),
    sandbox: !!config?.sandbox?.enabled,
    webSearch: !!config?.webSearch?.enabled,
    imageGeneration: !!config?.imageGeneration?.enabled,
    speech: !!config?.speech?.enabled,
    manager: !!config?.manager?.enabled,
    hasSkills: opts.hasSkills,
    hasPlan: opts.hasPlan ?? false,
  };
}

// ── Dynamic prompt renderers (template varies per config) ────────────

interface ManagerTeamMember {
  id: string;
  name: string;
  delegationHint?: string;
  role?: string;
  /** Compact "skill (connection)" list — empty when no usable skills. */
  skillBlurb: string;
}

interface ManagerActiveDelegation {
  taskId: string;
  targetName: string;
  title: string;
}

interface PromptData {
  agentId: string;
  name: string;
  personality?: string;
  role?: string;
  userDisplayName: string;
  userAbout?: string;
  manager?: {
    team: ManagerTeamMember[];
    activeDelegations: ManagerActiveDelegation[];
  };
}

interface TaskPromptData extends PromptData {
  taskTitle: string;
  /** Task ID. Used in templates as {{taskId}}. */
  taskId: string;
}

export function renderSystemPrompt(
  data: PromptData,
  flags: SystemPromptFlags,
): string {
  const template = assembleSystemTemplate(flags);
  return Handlebars.compile(template, { noEscape: true })(data);
}

export function renderTaskSystemPrompt(
  data: TaskPromptData,
  flags: TaskSystemPromptFlags,
): string {
  const template = assembleTaskSystemTemplate(flags);
  return Handlebars.compile(template, { noEscape: true })(data);
}
