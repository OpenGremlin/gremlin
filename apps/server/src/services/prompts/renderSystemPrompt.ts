import Handlebars from "handlebars";
import { systemTemplate } from "./templates/system.js";

interface SystemPromptData {
  name: string;
  soul: string;
  userDisplayName: string;
  userAbout?: string;
}

const template = Handlebars.compile<SystemPromptData>(systemTemplate, {
  noEscape: true,
});

export function renderSystemPrompt(data: SystemPromptData): string {
  return template(data);
}
