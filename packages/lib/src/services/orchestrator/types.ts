import type { ModelMessage, Tool } from "ai";

export interface OrchestratorContext {
  agentId: string;
  taskId?: string;
  systemPrompt: string;
  messages: ModelMessage[];
  tools: Record<string, Tool>;
}
