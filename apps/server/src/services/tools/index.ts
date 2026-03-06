export { delegateTaskTool } from "./delegateTask.js";
export {
  createDocumentTool,
  formatWithFrontmatter,
  getWorkspacePath,
  parseFrontmatter,
  slugify,
  uniqueFilePath,
  updateDocumentTool,
} from "./documents.js";
export { checkInbox, sendEmail } from "./email.js";
export { recallMemoryTool, saveMemoryTool } from "./memory.js";
export { requestApprovalTool } from "./requestApproval.js";
export { updateTaskMessageTool } from "./updateTaskMessage.js";
export { webSearch } from "./webSearch.js";

import { checkInbox, sendEmail } from "./email.js";
import { webSearch } from "./webSearch.js";

export const defaultTools = { webSearch, sendEmail, checkInbox };
