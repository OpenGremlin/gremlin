import Handlebars from "handlebars";
import { taskSystemTemplate } from "./templates/taskSystem.js";

interface TaskSystemPromptData {
  name: string;
  soul: string;
  userDisplayName: string;
  userAbout?: string;
  taskTitle: string;
  taskId: string;
}

const template = Handlebars.compile<TaskSystemPromptData>(taskSystemTemplate, {
  noEscape: true,
});

export function renderTaskSystemPrompt(data: TaskSystemPromptData): string {
  return template(data);
}
