/**
 * Shared Handlebars template sections used by both system and taskSystem prompts.
 * Each export is a self-contained prompt section (a Handlebars template string).
 * TypeScript assembles the relevant sections; Handlebars renders the final result.
 */

export { identitySection } from "./identity.js";
export { jobsSection } from "./jobs.js";
export { managerSection } from "./managerSection.js";
export { memorySection } from "./memory.js";
export { taskFileEditorSection } from "./taskFileEditor.js";
export { taskPlanSection } from "./taskPlan.js";
export { taskPreambleSection } from "./taskPreamble.js";
export { taskSandboxSection } from "./taskSandbox.js";
export { taskWorkflowSection } from "./taskWorkflow.js";
export { viewImageMainSection } from "./viewImageMain.js";
