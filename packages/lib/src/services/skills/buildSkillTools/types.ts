export interface SkillToolsResult {
  // biome-ignore lint/suspicious/noExplicitAny: tool types vary
  tools: Record<string, any>;
  /** Current skill env — call getEnv() to get the latest after a load/refresh */
  getEnv: () => Record<string, string>;
}

export type AgentSkills = Awaited<
  ReturnType<typeof import("../getAgentSkills.js").getAgentSkills>
>;
