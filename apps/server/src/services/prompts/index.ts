import { renderSystemPrompt } from "./renderSystemPrompt.js";
import { renderTaskSystemPrompt } from "./renderTaskSystemPrompt.js";

export const promptService = { renderSystemPrompt, renderTaskSystemPrompt };

export type PromptService = typeof promptService;
